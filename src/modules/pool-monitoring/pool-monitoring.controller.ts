import { Controller, Get } from '@nestjs/common';
import { PoolMonitoringService } from './pool-monitoring.service';
import { PoolStats } from './entities/pool-stats.entity';

@Controller('pool-monitoring')
export class PoolMonitoringController {
  constructor(private readonly poolMonitoringService: PoolMonitoringService) {}

  @Get('/latest-stat')
  async getLatestStat(): Promise<PoolStats> {
    return this.poolMonitoringService.getLatestStat();
  }
}
