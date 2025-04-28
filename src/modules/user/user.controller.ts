import { Controller, Post, Body, Get } from '@nestjs/common';
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
}
