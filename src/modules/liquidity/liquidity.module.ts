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
import { PoolMonitoringModule } from '../pool-monitoring/pool-monitoring.module';
import { ElizaAgentService } from 'src/services/eliza-agent.service';
import { HttpModule } from '@nestjs/axios';
import { RaydiumApiService } from 'src/services/raydium.api.service';

@Module({
  imports: [
  
    TypeOrmModule.forFeature([WalletBalance, UserConfig, LiquidityHistory]),
    forwardRef(() => UserModule),
    PoolMonitoringModule,
  ],
  controllers: [LiquidityController],
  providers: [
    LiquidityService,
    RaydiumClmmService,
    LiquidityTaskService,
    ElizaAgentService,
    RaydiumApiService
  ],
  exports: [LiquidityService],
})
export class LiquidityModule {}
