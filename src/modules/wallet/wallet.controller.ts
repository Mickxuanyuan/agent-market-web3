import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WithdrawalStatus } from '../../common/enums';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/auth/types';
import { WalletService } from './wallet.service';
import { GrantBalanceDto } from './dto/grant-balance.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  // 用户侧：查询自己的余额
  @Get('balance')
  @ApiOperation({ summary: '获取余额', description: '返回可用余额与冻结余额。' })
  @ApiOkResponse({ type: WalletBalanceDto })
  async getBalance(@CurrentUser() user: CurrentUserType): Promise<WalletBalanceDto> {
    return this.wallet.getBalance(user);
  }

  // 开发侧：给当前用户“发币”，用于测试后续冻结/结算流程。
  // 生产环境建议移除或加管理员鉴权。
  @Post('dev/grant')
  @ApiOperation({
    summary: '发放余额（开发用）',
    description: '向当前用户发放平台币到可用余额（仅用于开发/测试）。',
  })
  @ApiOkResponse({ type: WalletBalanceDto })
  async grantDevBalance(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: GrantBalanceDto,
  ): Promise<WalletBalanceDto> {
    return this.wallet.grantDevBalance(user, dto.amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: '发起提现', description: '创建提现申请记录。' })
  @ApiOkResponse({ type: WithdrawalDto })
  withdraw(@Body() _dto: WithdrawRequestDto): WithdrawalDto {
    // Swagger 示例返回。
    return {
      id: '1',
      amount: '5.00',
      status: WithdrawalStatus.requested,
      txHash: undefined,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get('withdrawals')
  @ApiOperation({ summary: '提现列表', description: '返回提现记录列表。' })
  @ApiOkResponse({ type: [WithdrawalDto] })
  listWithdrawals(): WithdrawalDto[] {
    // Swagger 示例返回。
    return [];
  }
}
