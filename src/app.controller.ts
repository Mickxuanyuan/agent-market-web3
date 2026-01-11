import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // 注入业务服务。
  constructor(private readonly appService: AppService) {}

  @Get()
  // 健康检查/欢迎接口。
  getHello(): string {
    return this.appService.getHello();
  }
}
