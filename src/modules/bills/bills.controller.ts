import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillStatus } from '../../common/enums';
import { BillDto } from './dto/bill.dto';

@ApiTags('Bills')
@Controller('bills')
export class BillsController {
  @Get()
  @ApiOperation({ summary: '账单列表', description: '返回所有账单（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [BillDto] })
  findAll(): BillDto[] {
    // Swagger 示例返回。
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: '账单详情', description: '根据 ID 获取账单详情。' })
  @ApiOkResponse({ type: BillDto })
  findOne(@Param('id') _id: string): BillDto {
    // Swagger 示例返回。
    return {
      id: '1',
      jobId: '1',
      status: BillStatus.locked,
      amount: '5.00',
      releasedAt: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}
