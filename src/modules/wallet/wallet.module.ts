import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
