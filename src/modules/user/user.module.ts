import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Wallet } from './entities/wallet.entity';
import { UserConfig } from './entities/user-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, UserConfig]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
