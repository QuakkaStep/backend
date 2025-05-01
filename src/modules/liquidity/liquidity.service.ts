// src/modules/liquidity/liquidity.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicKey } from '@solana/web3.js';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';

@Injectable()
export class LiquidityService {
  constructor(
    private readonly raydiumClmmService: RaydiumClmmService,
    private readonly configService: ConfigService,
  ) {}

  async previewSingleSidedLiquidity(
    publicKey: string,
    amount: number,
    minPrice: number,
    maxPrice: number,
  ) {
    // check
    return await this.raydiumClmmService.computeSingleSidedLiquidity(
      new PublicKey(publicKey),
      amount,
      minPrice,
      maxPrice,
    );
  }
}
