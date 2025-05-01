import { Controller, Post, Body } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Post('preview')
  async getLiquidityPreview(@Body() body: any) {
    const { publicKey, amount, minPrice, maxPrice } = body;

    // Validate inputs (optional but recommended)
    if (!publicKey || !amount || !minPrice || !maxPrice) {
      throw new Error('Missing required parameters');
    }

    return this.liquidityService.previewSingleSidedLiquidity(
      publicKey,
      Number(amount),
      Number(minPrice),
      Number(maxPrice),
    );
  }
}