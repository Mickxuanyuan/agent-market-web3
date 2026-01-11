const DEFAULT_SCALE = 18n;

// 将十进制字符串（如 "12.34"）转成定点整数（BigInt）。
// - scale 默认 18：对应 DECIMAL(36,18) 的“最小单位”
// - 用于做金额大小比较、校验正负等（避免直接用 JS number 产生精度问题）
export function decimalToBigInt(value: string, scale: bigint = DEFAULT_SCALE) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Invalid decimal');

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole = '0', fraction = ''] = unsigned.split('.');

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
