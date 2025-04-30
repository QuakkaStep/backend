import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PoolMonitoringService } from './pool-monitoring.service';

@Injectable()
export class PoolMonitoringTaskService {
  private readonly logger = new Logger(PoolMonitoringTaskService.name);

  constructor(private readonly poolMonitoringService: PoolMonitoringService) {}

  @Interval(1000 * 5)
  async handleCron() {
    this.logger.log('Running scheduled task to fetch pool stats...');
    await this.poolMonitoringService.fetchAndSavePoolStats();
  }
}
