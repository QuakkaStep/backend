import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('history')
  async getHistory(
    @Query('publicKey') publicKey: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.liquidityService.getLiquidityHistory(publicKey, limit);
  }

  @Get('ai-config-generation')
  async aiConfigGeneration(
    @Query('publicKey') publicKey: string,
    @Query('tokenAddress') tokenAddress: string,
  ) {
    return this.liquidityService.aiConfigGeneration(publicKey, tokenAddress);
  }
}
