import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // 返回默认欢迎文本。
  getHello(): string {
    return 'Hello World!';
  }
}
