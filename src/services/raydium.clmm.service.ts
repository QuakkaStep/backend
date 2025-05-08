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
import Decimal from 'decimal.js';
import { BN } from 'bn.js';
import { ComputeLiquidityResult, createDefaultLiquidityResult } from './type';
import { fromSmallestUnit, toSmallestUnit } from 'src/modules/common/utils';

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
    poolId: string = 'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW', // trump/wsol
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
    const inputTokenDecimals = isInputA
      ? poolInfo.mintA.decimals
      : poolInfo.mintB.decimals;

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
    let bestResult: ComputeLiquidityResult = createDefaultLiquidityResult();

    // Binary search to find the optimal split between swap and liquidity input
    for (let i = 0; i < maxIterations; i++) {
      const mid = (left + right) / 2;
      const swapAmount = mid;
      const remainAmount = inputAmountRaw - swapAmount;

      // Step 1: Estimate how much SOL can be obtained by swapping part of TRUMP
      const swapRes = PoolUtils.computeAmountOutFormat({
        poolInfo: clmmPoolInfo,
        tickArrayCache: tickCache[poolId],
        amountIn: new BN(swapAmount.toString()),
        tokenOut: poolInfo[isInputA ? 'mintB' : 'mintA'],
        slippage,
        epochInfo,
      });

      if (!swapRes.allTrade) {
        this.logger.error(
          '[Swap] Not all tokens can be traded. Adjust input or pool liquidity.',
        );
        throw new Error('Swap failed: not all input tokens can be traded.');
      }

      const inputTokenAmount = fromSmallestUnit(
        swapRes.realAmountIn.amount.raw.toNumber(),
        inputTokenDecimals,
      );
      const inputTokenFee = fromSmallestUnit(
        swapRes.fee.raw.toNumber(),
        inputTokenDecimals,
      );

      const outputSolAmount = fromSmallestUnit(
        swapRes.amountOut.amount.raw.toNumber(),
        9,
      );

      this.logger.log(`[Swap] Swap Result:
      - Real Amount In: ${inputTokenAmount}
      - Swap Fee: ${inputTokenFee} // token (eg. TRUMP)
      - Amount Out (SOL): ${outputSolAmount}
      - Min Amount Out: ${fromSmallestUnit(swapRes.minAmountOut.amount.raw.toNumber(), 9)}
      - Execution Price: ${swapRes.executionPrice.toFixed()}
      - Price Impact: ${swapRes.priceImpact.toFixed()}%
      `);

      const swapSol = fromSmallestUnit(
        swapRes.amountOut.amount.raw.toNumber(),
        9,
      );

      bestResult.swap = {
        inputTokenAmount,
        inputTokenFee,
        outputSolAmount,
      };

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

      const solAmount = fromSmallestUnit(
        liquidityAmountOutInfo.amountA.amount.toNumber(),
        9,
      );
      const solFeeAmount = liquidityAmountOutInfo.amountA.fee
        ? fromSmallestUnit(liquidityAmountOutInfo.amountA.fee.toNumber(), 9)
        : 0;
      const tokenAmount = fromSmallestUnit(
        liquidityAmountOutInfo.amountB.amount.toNumber(),
        6,
      );
      const tokenFeeAmount = liquidityAmountOutInfo.amountB.fee
        ? fromSmallestUnit(liquidityAmountOutInfo.amountB.fee.toNumber(), 6)
        : 0;

      this.logger.log(`[Liquidity] Add Liquidity Result:
          - Liquidity (BN): ${liquidityAmountOutInfo.liquidity.toString()}
          - Sol amount: ${solAmount}
            - Fee: ${solFeeAmount}
          - Token Amount: ${tokenAmount}
            - Fee: ${tokenFeeAmount}
        `);

      bestResult.addLiquidity = {
        solAmount,
        tokenAmount,
        solFee: solFeeAmount,
        tokenFee: tokenFeeAmount,
      };

      // Step 3: Check if the swap SOL is within tolerance of the required liquidity SOL
      if (swapSol > solAmount && Math.abs(swapSol - solAmount) <= tolerance) {
        break;
      }

      if (swapSol < solAmount) {
        left = mid;
      } else {
        right = mid;
      }
    }

    if (!bestResult) {
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
