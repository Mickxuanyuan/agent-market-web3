import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillDto } from './dto/bill.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { BillsService } from './bills.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/auth/types';
import { parseIdAsBigInt } from '../../common/ids';

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  // 注入业务服务。
  constructor(private readonly bills: BillsService) {}

  // 将 Drizzle 行转换为 DTO（string），便于 JSON 返回与 Swagger 展示。
  private toDto(row: {
    id: bigint;
    jobId: bigint;
    status: string;
    amount: string;
    releasedAt: Date | null;
    createdAt: Date;
  }): BillDto {
    return {
      id: row.id.toString(),
      jobId: row.jobId.toString(),
      status: row.status as BillDto['status'],
      amount: row.amount,
      releasedAt: row.releasedAt ? row.releasedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: '账单列表', description: '返回所有账单（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [BillDto] })
  // 账单列表：仅返回当前用户账单。
  async findAll(@CurrentUser() user: CurrentUserType): Promise<BillDto[]> {
    const rows = await this.bills.listForUser(user);
    return rows.map((row) => this.toDto(row));
  }

  @Get(':id')
  @ApiOperation({ summary: '账单详情', description: '根据 ID 获取账单详情。' })
  @ApiOkResponse({ type: BillDto })
  // 账单详情：仅允许查看当前用户的账单。
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<BillDto> {
    const row = await this.bills.findOneForUser(user, parseIdAsBigInt(id));
    return this.toDto(row);
  }
}
