import { Injectable, Logger } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  ApiV3PoolInfoConcentratedItem,
  ClmmKeys,
  PoolUtils,
  TickUtils,
  Raydium,
  TxVersion,
} from '@raydium-io/raydium-sdk-v2';
import { ConfigService } from '@nestjs/config';
import { fromSmallestUnit, toSmallestUnit } from 'src/shared/utils';
import Decimal from 'decimal.js';
import { BN } from 'bn.js';

@Injectable()
export class RaydiumClmmService {
  private readonly logger = new Logger(RaydiumClmmService.name);
  private raydium: Raydium;
  private connection: Connection;
  private readonly cluster = 'mainnet';

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL');

    if (!rpcUrl) throw new Error('Missing SOLANA_RPC_URL env var');
    this.connection = new Connection(rpcUrl);
  }

  async init(owner: PublicKey) {
    if (this.raydium) return this.raydium;
    this.raydium = await Raydium.load({
      owner,
      connection: this.connection,
      cluster: this.cluster,
      disableFeatureCheck: true,
      blockhashCommitment: 'finalized',
    });
    return this.raydium;
  }

  async computeSingleSidedLiquidity(
    owner: PublicKey,
    inputAmount: number,
    startPrice: number,
    endPrice: number,
    poolId: string = 'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW',
    inputMint: string = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', // trump
    slippage = 10,
    maxIterations = 10,
    tolerance = 0.05,
  ) {
    await this.init(owner);

    const poolInfoData = await this.raydium.api.fetchPoolById({ ids: poolId });
    const poolInfo = poolInfoData[0] as ApiV3PoolInfoConcentratedItem;

    const clmmPoolInfo = await this.fetchClmmInfoWithRetry(poolInfo);
    if (!clmmPoolInfo) {
      this.logger.error('Failed to fetch CLMM pool info');
      throw new Error('failed to fetch clmm pool info');
    }

    const tickCache = await PoolUtils.fetchMultiplePoolTickArrays({
      connection: this.raydium.connection,
      poolKeys: [clmmPoolInfo],
    });

    const isInputA = poolInfo.mintA.toString() === inputMint;
    const { tick: lowerTick } = TickUtils.getPriceAndTick({
      poolInfo,
      price: new Decimal(startPrice),
      baseIn: true,
    });

    const { tick: upperTick } = TickUtils.getPriceAndTick({
      poolInfo,
      price: new Decimal(endPrice),
      baseIn: true,
    });

    const epochInfo = await this.raydium.fetchEpochInfo();

    let inputAmountRaw = toSmallestUnit(inputAmount, 6);
    let left = 0;
    let right = inputAmountRaw;
    let bestResult;

    // Binary search to find the optimal split between swap and liquidity input
    for (let i = 0; i < maxIterations; i++) {
      const mid = (left + right) / 2;
      const swapAmount = mid;
      const remainAmount = inputAmountRaw - swapAmount;

      this.logger.log(`Iteration ${i + 1}:
        - swapAmount: ${swapAmount.toString()}
        - remainAmount: ${remainAmount.toString()}`);

      // Step 1: Estimate how much SOL can be obtained by swapping part of TRUMP
      const { amountOut: solFromSwap } = PoolUtils.computeAmountOutFormat({
        poolInfo: clmmPoolInfo,
        tickArrayCache: tickCache[poolId],
        amountIn: new BN(swapAmount.toString()),
        tokenOut: poolInfo[isInputA ? 'mintB' : 'mintA'],
        slippage,
        epochInfo,
      });

      // Step 2: Estimate how much liquidity can be added with the remaining TRUMP and swapped SOL
      const liquidityAmountOutInfo =
        await PoolUtils.getLiquidityAmountOutFromAmountIn({
          poolInfo,
          slippage,
          inputA: isInputA,
          tickLower: lowerTick,
          tickUpper: upperTick,
          amount: new BN(remainAmount),
          add: true,
          amountHasFee: true,
          epochInfo,
        });

      const targetWsol = fromSmallestUnit(
        liquidityAmountOutInfo.amountA.amount.toNumber(),
        9,
      );
      const targetTrump = fromSmallestUnit(
        liquidityAmountOutInfo.amountB.amount.toNumber(),
        6,
      );
      const swapSol = fromSmallestUnit(solFromSwap.amount.raw.toNumber(), 9);

      this.logger.log(
        `target Wsol: ${targetWsol}, target Trump: ${targetTrump}, Swap Sol: ${swapSol}`,
      );

      // Step 3: Check if the swap SOL is within tolerance of the required liquidity SOL
      if (Math.abs(swapSol - targetWsol) <= tolerance) {
        bestResult = {
          solAmount: targetWsol,
          trumpAmount: targetTrump,
        };
        break;
      }

      // Adjust binary search bounds based on whether we need more or less SOL
      if (swapSol < targetWsol) {
        left = mid;
      } else {
        right = mid;
      }
    }

    if (!bestResult) {
      this.logger.error('Failed to find suitable liquidity ratio');
      throw new Error('failed to find suitable liquidity ratio');
    }

    return bestResult;
  }

  private async fetchClmmInfoWithRetry(
    poolInfo: ApiV3PoolInfoConcentratedItem,
    retries = 3,
    delay = 1000,
  ) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.log(`Attempt ${attempt} to fetch CLMM pool info`);
        return await PoolUtils.fetchComputeClmmInfo({
          connection: this.raydium.connection,
          poolInfo,
        });
      } catch (error) {
        this.logger.error(
          `Failed to fetch CLMM info (attempt ${attempt}): ${error}`,
        );
        if (attempt < retries)
          await new Promise((res) => setTimeout(res, delay));
        else throw error;
      }
    }
  }
}
