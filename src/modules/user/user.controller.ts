import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { InitUserConfigDto } from './dtos/create-user-config.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('init-config')
  async initConfig(@Body() config: InitUserConfigDto) {
    return this.userService.saveConfig(config);
  }

  @Get('generate-wallet')
  async generateWallet() {
    return this.userService.generateWallet();
  }

  @Get('token-balance')
  async getWalletTokenHold(@Query('publicKey') publicKey: string) {
    return this.userService.getAllTokenBalances(publicKey);
  }

  @Get('portfolio')
  async getPortfolio(@Query('publicKey') publicKey: string) {
    return this.userService.getFullPortfolio(publicKey);
  }
}
