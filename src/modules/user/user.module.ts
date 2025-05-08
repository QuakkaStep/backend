import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Wallet } from './entities/wallet.entity';
import { UserConfig } from './entities/user-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalance } from './entities/wallet-balance.entity';
import { LiquidityModule } from '../liquidity/liquidity.module';
import { LiquidityHistory } from '../liquidity/entities/liquidity-history.entity';
import { RaydiumApiService } from 'src/services/raydium.api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      UserConfig,
      WalletBalance,
      LiquidityHistory,
    ]),
    forwardRef(() => LiquidityModule),
  ],
  controllers: [UserController],
  providers: [UserService, RaydiumApiService],
  exports: [UserService],
})
export class UserModule {}
