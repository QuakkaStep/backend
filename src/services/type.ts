export namespace Raydium {
  // 定义池子信息类型
  export type PoolInfo = {
    type: string;
    programId: string;
    id: string;
    mintA: any;
    mintB: any;
    rewardDefaultPoolInfos: string;
    rewardDefaultInfos: any[];
    price: number;  // 价格字段
    mintAmountA: number;
    mintAmountB: number;
    feeRate: number;
    openTime: string;
    tvl: number;
    day: {
      volume: number;
      volumeQuote: number;
      volumeFee: number;
      apr: number;
      feeApr: number;
      priceMin: number;
      priceMax: number;
      rewardApr: any[];
    };
    week: any;
    month: any;
    pooltype: any[];
    farmUpcomingCount: number;
    farmOngoingCount: number;
    farmFinishedCount: number;
    config: any;
    burnPercent: number;
  };

  // 响应类型，直接返回data字段
  export type PoolInfoResponse = {
    id: string;
    success: boolean;
    data: PoolInfo[];  // 返回池子数据数组
  };

  // mint价格的接口类型
  export type MintPriceResponse = {
    [mint: string]: number; // mint 地址对应的价格
  };
}
