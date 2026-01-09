import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WithdrawalStatus } from '../../common/enums';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  @Get('balance')
  @ApiOperation({ summary: '获取余额', description: '返回可用余额与冻结余额。' })
  @ApiOkResponse({ type: WalletBalanceDto })
  getBalance(): WalletBalanceDto {
    // Swagger 示例返回。
    return {
      available: '100.00',
      frozen: '10.00',
    };
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
