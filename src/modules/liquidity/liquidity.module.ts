import { Module } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';
import { UserModule } from '../user/user.module';
import { WalletBalance } from '../user/entities/wallet-balance.entity';
import { UserConfig } from '../user/entities/user-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([WalletBalance, UserConfig]), UserModule],
  controllers: [LiquidityController],
  providers: [LiquidityService, RaydiumClmmService],
  exports: [LiquidityService],
})
export class LiquidityModule {}
