const DEFAULT_SCALE = 6n;

// 将十进制字符串（如 "12.34"）转成定点整数（BigInt）。
// - scale 默认 18：对应 DECIMAL(36,18) 的“最小单位”
// - 用于做金额大小比较、校验正负等（避免直接用 JS number 产生精度问题）
export function decimalToBigInt(value: string, scale: bigint = DEFAULT_SCALE) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Invalid decimal');

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const parts = unsigned.split('.');
  if (parts.length > 2) {
    throw new Error('Invalid decimal');
  }
  const [whole = '0', fraction = ''] = parts;

  if (!/^\d+$/.test(whole) || (fraction && !/^\d+$/.test(fraction))) {
    throw new Error('Invalid decimal');
  }

  // 小数部分右补 0 到指定 scale，并截断多余位（MVP：不做四舍五入）
  const paddedFraction = (fraction + '0'.repeat(Number(scale))).slice(
    0,
    Number(scale),
  );

  const asInt = BigInt(whole || '0') * 10n ** scale + BigInt(paddedFraction);
  return negative ? -asInt : asInt;
}

// 将定点整数（BigInt）转回十进制字符串。
// - scale 默认 18：对应 DECIMAL(36,18)
// - 用于把链上 uint256 金额写回数据库的数值字段
export function bigIntToDecimal(value: bigint, scale: bigint = DEFAULT_SCALE) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** scale;
  const whole = abs / base;
  const fraction = abs % base;

  if (fraction === 0n) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  const padded = fraction.toString().padStart(Number(scale), '0');
  const trimmed = padded.replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole.toString()}.${trimmed}`;
}
