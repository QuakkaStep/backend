export namespace Raydium {
  export interface TokenInfo {
    chainId: number;
    address: string;
    programId: string;
    logoURI: string;
    symbol: string;
    name: string;
    decimals: number;
    tags: string[];
    extensions: Record<string, unknown>;
  }

  export interface PoolPeriodStats {
    volume: number;
    volumeQuote: number;
    volumeFee: number;
    apr: number;
    feeApr: number;
    priceMin: number;
    priceMax: number;
    rewardApr: any[]; // 可进一步细化结构，如有例子的话
  }

  export interface PoolConfig {
    id: string;
    index: number;
    protocolFeeRate: number;
    tradeFeeRate: number;
    tickSpacing: number;
    fundFeeRate: number;
    defaultRange: number;
    defaultRangePoint: number[];
  }

  export interface PoolInfo {
    type: string;
    programId: string;
    id: string;
    mintA: TokenInfo;
    mintB: TokenInfo;
    rewardDefaultPoolInfos: string;
    rewardDefaultInfos: any[]; // 同样可进一步细化
    price: number;
    mintAmountA: number;
    mintAmountB: number;
    feeRate: number;
    openTime: string;
    tvl: number;
    day: PoolPeriodStats;
    week: PoolPeriodStats;
    month: PoolPeriodStats;
    pooltype: string[];
    farmUpcomingCount: number;
    farmOngoingCount: number;
    farmFinishedCount: number;
    config: PoolConfig;
    burnPercent: number;
    launchMigratePool: boolean;
  }

  export interface PoolInfoResponse {
    id: string;
    success: boolean;
    data: PoolInfo[];
  }

  export interface MintPriceResponse {
    [mint: string]: number;
  }
}


export interface ComputeLiquidityResult {
  
  swap: {
    inputTokenAmount: number;
    inputTokenFee: number;
    outputSolAmount: number;
  };
  addLiquidity: {
    solAmount: number;
    tokenAmount: number;
    solFee: number;
    tokenFee: number;
  };
}

export function createDefaultLiquidityResult(): ComputeLiquidityResult {
  return {
    swap: {
      inputTokenAmount: 0,
      inputTokenFee: 0,
      outputSolAmount: 0,
    },
    addLiquidity: {
      solAmount: 0,
      tokenAmount: 0,
      solFee: 0,
      tokenFee: 0,
    },
  };
}



export namespace Elizaos{
  export interface Agent {
    id: string;
    name: string;
    clients: string[];
  }
  
  export interface AgentResponse {
    agents: Agent[];
  }
  
  export interface CLMMConfig {
    stepPercentage: number;
    addLiquidityAmount: number;
    minPrice: number;
    maxPrice: number;
  }

  export interface ElizaResponseItem {
    user?: string;
    text: string;
    action?: string;
    content?: {
      config?: CLMMConfig;
    };
  }
}


