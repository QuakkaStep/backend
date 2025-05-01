import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Wallet } from './entities/wallet.entity';
import { UserConfig } from './entities/user-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletBalance } from './entities/wallet-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, UserConfig, WalletBalance]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
