/**
 * 将人类可读的 Token 单位转为链上最小单位
 * @param amount 例如 1.23（表示 1.23 个 token）
 * @param decimals token 的精度，例如 USDC 是 6
 */
export function toSmallestUnit(amount: number, decimals: number): number {
  return amount * 10 ** decimals;
}

/**
 * 将链上的最小单位数量转回人类可读的 token 单位
 * @param smallestAmount 例如 1230000（USDC 代表 1.23）
 * @param decimals token 的精度
 */
export function fromSmallestUnit(
  smallestAmount: number,
  decimals: number,
): number {
  return smallestAmount / 10 ** decimals;
}
