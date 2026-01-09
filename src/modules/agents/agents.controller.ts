import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentDto } from './dto/agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentStatus } from '../../common/enums';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  @Post()
  @ApiOperation({ summary: '创建 Agent', description: '注册新的 Agent（包含价格与执行地址）。' })
  @ApiOkResponse({ type: AgentDto })
  create(@Body() _dto: CreateAgentDto): AgentDto {
    // Swagger 示例返回，后续替换为真实逻辑。
    return {
      id: '1',
      ownerUserId: '1',
      name: 'Copy Writer',
      url: 'https://agent.example.com/run',
      description: 'Writes marketing copy',
      price: '5.00',
      status: AgentStatus.enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Agent 列表', description: '返回所有 Agent（MVP 暂不分页）。' })
  @ApiOkResponse({ type: [AgentDto] })
  findAll(): AgentDto[] {
    // Swagger 示例返回。
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Agent 详情', description: '根据 ID 获取 Agent 详情。' })
  @ApiOkResponse({ type: AgentDto })
  findOne(@Param('id') _id: string): AgentDto {
    // Swagger 示例返回。
    return {
      id: '1',
      ownerUserId: '1',
      name: 'Copy Writer',
      url: 'https://agent.example.com/run',
      description: 'Writes marketing copy',
      price: '5.00',
      status: AgentStatus.enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 Agent', description: '更新 Agent 字段或状态。' })
  @ApiOkResponse({ type: AgentDto })
  update(@Param('id') _id: string, @Body() _dto: UpdateAgentDto): AgentDto {
    // Swagger 示例返回。
    return {
      id: '1',
      ownerUserId: '1',
      name: 'Copy Writer',
      url: 'https://agent.example.com/run',
      description: 'Writes marketing copy',
      price: '5.00',
      status: AgentStatus.enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
