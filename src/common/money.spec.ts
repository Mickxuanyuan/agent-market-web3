import { bigIntToDecimal, decimalToBigInt } from './money';

describe('decimalToBigInt', () => {
  it('应转换为定点整数', () => {
    expect(decimalToBigInt('1.23')).toBe(1230000n);
    expect(decimalToBigInt('0.000001')).toBe(1n);
    expect(decimalToBigInt('10')).toBe(10000000n);
  });

  it('应支持负数', () => {
    expect(decimalToBigInt('-1.5')).toBe(-1500000n);
  });

  it('非法输入应抛错', () => {
    expect(() => decimalToBigInt('')).toThrow();
    expect(() => decimalToBigInt('abc')).toThrow();
    expect(() => decimalToBigInt('1.2.3')).toThrow();
  });
});

describe('bigIntToDecimal', () => {
  it('formats whole numbers', () => {
    expect(bigIntToDecimal(1000000n)).toBe('1');
  });

  it('formats fractional numbers', () => {
    expect(bigIntToDecimal(1230000n)).toBe('1.23');
  });
});
