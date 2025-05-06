import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('increase')
  async getLiquidityPreview(@Query('publicKey') publicKey: string) {
    return this.liquidityService.increaseSingleSidedLiquidity(publicKey);
  }

  @Get('history')
  async getHistory(
    @Query('publicKey') publicKey: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.liquidityService.getLiquidityHistory(publicKey, limit);
  }

  @Get('ai-config-recommender')
  async getAiConfigRecommender(@Query('publicKey') publicKey: string) {
    return this.liquidityService.getAiConfigRecommender(publicKey);
  }
}
