import { BadRequestException } from '@nestjs/common';
import { parseIdAsBigInt } from './ids';

describe('parseIdAsBigInt', () => {
  it('应解析数字字符串', () => {
    expect(parseIdAsBigInt('123')).toBe(123n);
  });

  it('非数字应抛错', () => {
    expect(() => parseIdAsBigInt('abc')).toThrow(BadRequestException);
    expect(() => parseIdAsBigInt('1-2')).toThrow(BadRequestException);
    expect(() => parseIdAsBigInt('')).toThrow(BadRequestException);
  });
});
