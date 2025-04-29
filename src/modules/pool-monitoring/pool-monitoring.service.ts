import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoolStats } from './entities/pool-stats.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { RaydiumPoolInfoResponse } from './type';

@Injectable()
export class PoolMonitoringService {
  private readonly logger = new Logger(PoolMonitoringService.name);
  private readonly poolId: string;
  private readonly raydiumApiUrl: string;

  constructor(
    @InjectRepository(PoolStats)
    private readonly poolStatsRepository: Repository<PoolStats>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.poolId = this.configService.get<string>(
      'POOL_ID',
      'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW',
    );
    this.raydiumApiUrl = this.configService.get<string>(
      'RAYDIUM_API_URL',
      `https://api-v3.raydium.io/pools/info/ids?ids=${this.poolId}`,
    );
  }

  async fetchAndSavePoolStats() {
    try {
      const url = `${this.raydiumApiUrl}?ids=${this.poolId}`;
      const response = await firstValueFrom(
        this.httpService.get<RaydiumPoolInfoResponse>(url),
      );
      const data = response.data?.data?.[0];

      if (!data) {
        this.logger.warn('No data received from Raydium API');
        return;
      }

      const newStats = this.poolStatsRepository.create({
        poolId: data.id,
        liquidity: data.tvl,
        volume24h: data.day.volumeQuote,
        fees24h: data.day.volumeFee,
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
