import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { VerifyDto } from './dto/verify.dto';
import { VerifyResponseDto } from './dto/verify-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: '获取 nonce', description: '生成一次性口令与待签名消息' })
  @ApiQuery({ name: 'address', required: true })
  @ApiOkResponse({ type: NonceResponseDto })
  async getNonce(@Query('address') address: string): Promise<NonceResponseDto> {
    return this.auth.createNonce(address);
  }

  @Post('verify')
  @ApiOperation({ summary: '验签登录', description: '验证签名并签发 JWT' })
  @ApiOkResponse({ type: VerifyResponseDto })
  async verify(@Body() dto: VerifyDto): Promise<VerifyResponseDto> {
    return this.auth.verify(dto.message, dto.signature);
  }
}

