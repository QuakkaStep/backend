import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LiquidityService } from '../liquidity/liquidity.service';

@Injectable()
export class LiquidityTaskService {
  private readonly logger = new Logger(LiquidityTaskService.name);
  private isRunning = false;

  constructor(private readonly liquidityService: LiquidityService) {}

  @Interval(5000)
  async timedCheckAddLiquidity() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      await this.liquidityService.timedCheckAddLiquidity();
    } catch (error) {
      this.logger.error('timedCheckAddLiquidity error', error);
    } finally {
      this.isRunning = false;
    }
  }
}
