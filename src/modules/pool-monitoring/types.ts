export interface PoolStatsDto {
  price: number;
  poolId: string;
  liquidity: number;
  volume24h: number;
  fees24h: number;
}

export interface PoolDynamicParamsDto {
  price: number;
  mintAmountA: number;
  mintAmountB: number;
  feeRate: number;
  tvl: number;
  volume24h: number;
  volumeFee24h: number;
  apr24h: number;
  priceMin24h: number;
  priceMax24h: number;
}
