import { decimalToBigInt } from './money';

describe('decimalToBigInt', () => {
  it('应转换为定点整数', () => {
    expect(decimalToBigInt('1.23')).toBe(1230000000000000000n);
    expect(decimalToBigInt('0.000000000000000001')).toBe(1n);
    expect(decimalToBigInt('10')).toBe(10000000000000000000n);
  });

  it('应支持负数', () => {
    expect(decimalToBigInt('-1.5')).toBe(-1500000000000000000n);
  });

  it('非法输入应抛错', () => {
    expect(() => decimalToBigInt('')).toThrow();
    expect(() => decimalToBigInt('abc')).toThrow();
    expect(() => decimalToBigInt('1.2.3')).toThrow();
  });
});
