export type RaydiumPoolInfoResponse = {
  id: string;
  success: boolean;
  data: Array<{
    type: string;
    programId: string;
    id: string;
    mintA: any;
    mintB: any;
    rewardDefaultPoolInfos: string;
    rewardDefaultInfos: any[];
    price: number;
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
  }>;
};
