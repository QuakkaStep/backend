import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RaydiumApiService } from 'src/services/raydium.api.service';
import { PoolDynamicParamsDto, PoolStatsDto } from './types';

@Injectable()
export class PoolMonitoringService {
  private readonly logger = new Logger(PoolMonitoringService.name);

  constructor(private readonly raydiumApiService: RaydiumApiService) {}

  async getTokenInfo(poolId: string) {
    try {
      const poolInfo = await this.getDynamicPoolParams(poolId);
      if (!poolInfo?.price) {
        throw new Error('Price not found in pool info');
      }
      return {
        price: poolInfo.price,
        symbol: poolInfo.tokenB.symbol,
        tokenAddr: poolInfo.tokenB.mint,
      };
    } catch (error) {
      this.logger.error(
        `Error getting current price: ${error.message}`,
        error.stack,
      );
      throw new NotFoundException('Could not fetch current price');
    }
  }

  async getDynamicPoolParams(poolId: string): Promise<PoolDynamicParamsDto> {
    try {
      const poolInfo = await this.raydiumApiService.fetchPoolInfo(poolId);
      if (!poolInfo?.price || !poolInfo?.tvl || !poolInfo?.day) {
        throw new Error('Incomplete pool info');
      }

      return {
        poolId: poolInfo.id,
        tokenA: {
          symbol: poolInfo.mintA.symbol,
          mint: poolInfo.mintA.address,
          decimals: poolInfo.mintA.decimals,
        },
        tokenB: {
          symbol: poolInfo.mintB.symbol,
          mint: poolInfo.mintB.address,
          decimals: poolInfo.mintB.decimals,
        },
        price: poolInfo.price,
        mintAmountA: poolInfo.mintAmountA,
        mintAmountB: poolInfo.mintAmountB,
        feeRate: poolInfo.feeRate,
        tvl: poolInfo.tvl,

        volume24h: poolInfo.day.volumeQuote,
        volumeFee24h: poolInfo.day.volumeFee,
        apr24h: poolInfo.day.apr,
        priceMin24h: poolInfo.day.priceMin,
        priceMax24h: poolInfo.day.priceMax,

        volume7d: poolInfo.week.volumeQuote,
        volumeFee7d: poolInfo.week.volumeFee,
        apr7d: poolInfo.week.apr,
        priceMin7d: poolInfo.week.priceMin,
        priceMax7d: poolInfo.week.priceMax,

        volume30d: poolInfo.month.volumeQuote,
        volumeFee30d: poolInfo.month.volumeFee,
        apr30d: poolInfo.month.apr,
        priceMin30d: poolInfo.month.priceMin,
        priceMax30d: poolInfo.month.priceMax,
      };
    } catch (error) {
      this.logger.error(
        `Error getting dynamic pool params: ${error.message}`,
        error.stack,
      );
      throw new NotFoundException('Could not fetch dynamic pool parameters');
    }
  }
}
