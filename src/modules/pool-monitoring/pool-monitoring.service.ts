import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RaydiumApiService } from 'src/services/raydium.api.service';
import { PoolDynamicParamsDto, PoolStatsDto } from './types';

@Injectable()
export class PoolMonitoringService {
  private readonly logger = new Logger(PoolMonitoringService.name);

  constructor(private readonly raydiumApiService: RaydiumApiService) {}

  async getCurrentPrice(poolId: string): Promise<number> {
    try {
      const poolInfo = await this.getCurrentPoolStats(poolId);
      if (!poolInfo?.price) {
        throw new Error('Price not found in pool info');
      }
      return poolInfo.price;
    } catch (error) {
      this.logger.error(
        `Error getting current price: ${error.message}`,
        error.stack,
      );
      throw new NotFoundException('Could not fetch current price');
    }
  }

  async getCurrentPoolStats(poolId: string): Promise<PoolStatsDto> {
    try {
      const poolInfo = await this.raydiumApiService.fetchPoolInfo(poolId);
      if (!poolInfo?.price || !poolInfo?.tvl || !poolInfo?.day) {
        throw new Error('Incomplete pool info');
      }

      return {
        price: poolInfo.price,
        poolId: poolInfo.id,
        liquidity: poolInfo.tvl,
        volume24h: poolInfo.day.volumeQuote,
        fees24h: poolInfo.day.volumeFee,
      };
    } catch (error) {
      this.logger.error(
        `Error getting pool stats: ${error.message}`,
        error.stack,
      );
      throw new NotFoundException('Could not fetch pool stats');
    }
  }

  async getDynamicPoolParams(poolId: string): Promise<PoolDynamicParamsDto> {
    try {
      const poolInfo = await this.raydiumApiService.fetchPoolInfo(poolId);
      if (!poolInfo?.price || !poolInfo?.tvl || !poolInfo?.day) {
        throw new Error('Incomplete pool info');
      }

      return {
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
