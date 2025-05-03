import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LiquidityService } from '../liquidity/liquidity.service';

@Injectable()
export class LiquidityTaskService {
  private readonly logger = new Logger(LiquidityTaskService.name);

  constructor(private readonly liquidityService: LiquidityService) {}

  @Interval(5000)
  async checkAndTriggerLiquidityForAll() {
    this.logger.debug('Checking and triggering liquidity...');

    await this.liquidityService.checkAndTriggerAutoLiquidity();
  }
}
