import { Module } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';

@Module({
  controllers: [LiquidityController],
  providers: [LiquidityService, RaydiumClmmService],
  exports: [LiquidityService], // 如果其他模块也需要用这个服务
})
export class LiquidityModule {}
