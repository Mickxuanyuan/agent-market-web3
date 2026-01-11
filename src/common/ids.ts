import { BadRequestException } from '@nestjs/common';

// 将路由参数里的 id（字符串）解析为 bigint。
// 约束：仅允许纯数字，避免把 "1;drop table" 之类的输入带进数据库层。
export function parseIdAsBigInt(id: string, fieldName = 'id'): bigint {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }
  return BigInt(id);
}
