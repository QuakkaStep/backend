import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserConfigDto } from './dtos/create-user-config.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('config-save')
  async saveConfig(@Body() createUserConfigDto: CreateUserConfigDto) {
    return this.userService.saveConfig(createUserConfigDto);
  }

  @Get('generate-wallet')
  async generateWallet() {
    return this.userService.generateWallet();
  }

  @Get('portfolio')
  async getWalletTokenHold(@Query('publicKey') publicKey: string) {
    return this.userService.getAllTokenBalances(publicKey);
  }
}
