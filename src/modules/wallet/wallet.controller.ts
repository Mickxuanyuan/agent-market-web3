import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { DepositRequestDto } from './dto/deposit-request.dto';
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
  // 注入业务服务。
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
  // 发起提现：创建提现记录并扣减余额。
  async withdraw(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: WithdrawRequestDto,
  ): Promise<WithdrawalDto> {
    return this.wallet.requestWithdraw(user, dto.amount, dto.txHash);
  }

  @Post('deposit')
  @ApiOperation({ summary: '发起充值', description: '创建充值申请记录。' })
  @ApiOkResponse({ type: WithdrawalDto })
  // 发起充值：创建充值记录，等待链上确认后入账。
  async deposit(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: DepositRequestDto,
  ): Promise<WithdrawalDto> {
    return this.wallet.requestDeposit(user, dto.amount, dto.txHash);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: '提现列表', description: '返回提现记录列表。' })
  @ApiOkResponse({ type: [WithdrawalDto] })
  // 提现列表：仅返回当前用户的记录。
  async listWithdrawals(
    @CurrentUser() user: CurrentUserType,
  ): Promise<WithdrawalDto[]> {
    return this.wallet.listWithdrawals(user);
  }
}
