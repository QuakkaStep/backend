import { Controller, Get, Query } from '@nestjs/common';
import { PoolMonitoringService } from './pool-monitoring.service';
import { PoolDynamicParamsDto, PoolStatsDto } from './types';

@Controller('pool-monitoring')
export class PoolMonitoringController {
  constructor(private readonly poolMonitoringService: PoolMonitoringService) {}

  @Get('/info')
  async getLatestInfo(@Query('poolId') poolId: string): Promise<PoolStatsDto> {
    return this.poolMonitoringService.getCurrentPoolStats(poolId);
  }

  @Get('/dynamic-info')
  async getDynamicInfo(@Query('poolId') poolId: string): Promise<PoolDynamicParamsDto> {
    return this.poolMonitoringService.getDynamicPoolParams(poolId);
  }
}
