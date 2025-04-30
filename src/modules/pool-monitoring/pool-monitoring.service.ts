import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoolStats } from './entities/pool-stats.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { RaydiumApiService } from 'src/services/raydium.api.service';

@Injectable()
export class PoolMonitoringService {
  private readonly logger = new Logger(PoolMonitoringService.name);

  constructor(
    @InjectRepository(PoolStats)
    private readonly poolStatsRepository: Repository<PoolStats>,
    private readonly raydiumApiService: RaydiumApiService,
  ) {}

  async fetchAndSavePoolStats() {
    try {
      const poolInfo = await this.raydiumApiService.fetchPoolInfo();

      const newStats = this.poolStatsRepository.create({
        poolId: poolInfo.id,
        liquidity: poolInfo.tvl,
        volume24h: poolInfo.day.volumeQuote,
        fees24h: poolInfo.day.volumeFee,
      });

      await this.poolStatsRepository.save(newStats);
      this.logger.log(
        'New pool stats saved.',
        JSON.stringify(newStats, null, 2),
      );
    } catch (error) {
      this.logger.error('Error fetching or saving pool stats', error);
    }
  }

  async getLatestStat(): Promise<PoolStats> {
    const latestPoolInfo = await this.poolStatsRepository.findOne({
      where: {},
      order: {
        createdAt: 'DESC',
      },
    });
    if (latestPoolInfo == null) {
      throw new NotFoundException('No pool stats found');
    }
    return latestPoolInfo;
  }
}
