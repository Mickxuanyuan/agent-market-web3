import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { verifyMessage } from 'viem';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from 'jsonwebtoken';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { authNonces, balances, users } from '../../drizzle/schema';
import { JWT_EXPIRES_IN, NONCE_TTL_SECONDS } from './auth.constants';

type ParsedMessage = {
  address: string;
  nonce: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly jwt: JwtService,
  ) {}

  private normalizeWalletAddress(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.toLowerCase();
  }

  private buildMessage(params: { address: string; nonce: string }) {
    return `Agent Market Web3 Login\nAddress: ${params.address}\nNonce: ${params.nonce}`;
  }

  private parseMessage(message: string): ParsedMessage {
    const lines = message.split('\n').map((line) => line.trim());
    if (lines.length < 3) {
      throw new BadRequestException('Invalid message');
    }

    const titleLine = lines[0];
    const addressLine = lines.find((line) => line.startsWith('Address: '));
    const nonceLine = lines.find((line) => line.startsWith('Nonce: '));

    if (titleLine !== 'Agent Market Web3 Login' || !addressLine || !nonceLine) {
      throw new BadRequestException('Invalid message');
    }

    const address = this.normalizeWalletAddress(
      addressLine.replace('Address: ', ''),
    );
    const nonce = nonceLine.replace('Nonce: ', '');

    if (!address || address.length > 64 || !nonce) {
      throw new BadRequestException('Invalid message');
    }

    return { address, nonce };
  }

  async createNonce(address: string) {
    const normalized = this.normalizeWalletAddress(address);
    if (!normalized || normalized.length > 64) {
      throw new BadRequestException('Invalid wallet address');
    }

    const nonce = randomBytes(16).toString('hex');
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + NONCE_TTL_SECONDS * 1000);

    const message = this.buildMessage({
      address: normalized,
      nonce,
    });

    await this.drizzle.db.insert(authNonces).values({
      walletAddress: normalized,
      nonce,
      issuedAt,
      expiresAt,
    });

    return {
      address: normalized,
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verify(message: string, signature: string) {
    const parsed = this.parseMessage(message);

    const now = new Date();

    const nonceRow = await this.drizzle.db
      .select()
      .from(authNonces)
      .where(eq(authNonces.nonce, parsed.nonce))
      .limit(1);

    const nonce = nonceRow[0];
    if (!nonce || nonce.walletAddress !== parsed.address) {
      throw new UnauthorizedException('Invalid nonce');
    }
    if (nonce.usedAt) {
      throw new UnauthorizedException('Nonce already used');
    }
    if (nonce.expiresAt <= now) {
      throw new UnauthorizedException('Nonce expired');
    }

    const isValid = await verifyMessage({
      address: parsed.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.drizzle.db
      .update(authNonces)
      .set({ usedAt: now })
      .where(eq(authNonces.id, nonce.id));

    const userRow =
      (
        await this.drizzle.db
          .insert(users)
          .values({ walletAddress: parsed.address })
          .onConflictDoNothing({ target: users.walletAddress })
          .returning({ id: users.id, walletAddress: users.walletAddress })
      )[0] ??
      (
        await this.drizzle.db
          .select({ id: users.id, walletAddress: users.walletAddress })
          .from(users)
          .where(eq(users.walletAddress, parsed.address))
          .limit(1)
      )[0];

    if (!userRow) {
      throw new UnauthorizedException('Failed to resolve user');
    }

    await this.drizzle.db
      .insert(balances)
      .values({
        userId: userRow.id,
        available: '0',
        frozen: '0',
        updatedAt: now,
      })
      .onConflictDoNothing({ target: balances.userId });

    const token = await this.jwt.signAsync(
      {
        sub: userRow.id.toString(),
        walletAddress: userRow.walletAddress,
      },
      { expiresIn: JWT_EXPIRES_IN as JwtSignOptions['expiresIn'] },
    );

    return { token };
  }
}
