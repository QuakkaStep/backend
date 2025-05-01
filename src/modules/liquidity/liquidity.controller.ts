import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('increase')
  async getLiquidityPreview(@Query('publicKey') publicKey: string) {
    return this.liquidityService.increaseSingleSidedLiquidity(publicKey);
  }
}
