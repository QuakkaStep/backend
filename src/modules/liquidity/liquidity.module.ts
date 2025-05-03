import { forwardRef, Module } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';
import { UserModule } from '../user/user.module';
import { WalletBalance } from '../user/entities/wallet-balance.entity';
import { UserConfig } from '../user/entities/user-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidityHistory } from './entities/liquidity-history.entity';
import { LiquidityTaskService } from './task.service';
import { PoolStats } from '../pool-monitoring/entities/pool-stats.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletBalance,
      UserConfig,
      LiquidityHistory,
      PoolStats,
    ]),
    forwardRef(() => UserModule),
  ],
  controllers: [LiquidityController],
  providers: [LiquidityService, RaydiumClmmService, LiquidityTaskService],
  exports: [LiquidityService],
})
export class LiquidityModule {}
