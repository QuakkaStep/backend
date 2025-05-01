// src/modules/liquidity/liquidity.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicKey } from '@solana/web3.js';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';
import { WalletBalance } from '../user/entities/wallet-balance.entity';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { UserConfig } from '../user/entities/user-config.entity';
import { SOL_MINT, TRUMP_MINT } from '../common/utils';
import { ComputeLiquidityResult } from 'src/services/type';

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);

  constructor(
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    private readonly raydiumClmmService: RaydiumClmmService,
    private readonly userService: UserService,
  ) {}

  async increaseSingleSidedLiquidity(publicKey: string) {
    // fetch the user's config
    const userConfig = await this.userConfigRepository.findOne({
      where: { publicKey },
    });
    if (!userConfig) {
      throw new Error('User config not found');
    }
    const { minPrice, maxPrice, addLiquidityAmount: amount } = userConfig;

    this.logger.debug(`userConfig: ${JSON.stringify(userConfig)}`);

    const increaseRes =
      await this.raydiumClmmService.computeSingleSidedLiquidity(
        new PublicKey(publicKey),
        amount,
        minPrice,
        maxPrice,
      );

    this.logger.debug(`increaseRes: ${JSON.stringify(increaseRes, null, 2)}`);

    await this.updateBalancesAfterLiquidityAdd(publicKey, increaseRes);

    return increaseRes;
  }

  private async updateBalancesAfterLiquidityAdd(
    publicKey: string,
    increaseRes: ComputeLiquidityResult,
  ) {
    // Update SOL balance
    const solBalance = await this.userService.getBalanceByToken(
      publicKey,
      SOL_MINT,
    );

    const newSolBalance =
      solBalance +
      (increaseRes.swap.outputSolAmount - increaseRes.addLiquidity.solAmount);

    this.logger.debug(
      `[updateBalancesAfterLiquidityAdd] solBalance: ${solBalance}, newSolBalance: ${newSolBalance}`,
    );

    await this.userService.updateWalletBalance(
      publicKey,
      SOL_MINT,
      newSolBalance,
    );

    // Update token balance
    const trumpBalance = await this.userService.getBalanceByToken(
      publicKey,
      TRUMP_MINT,
    );
    const inputTokenAmount = Number(increaseRes.swap.inputTokenAmount);
    const addTokenAmount = Number(increaseRes.addLiquidity.tokenAmount);

    const newTrumpBalance = trumpBalance - (inputTokenAmount + addTokenAmount);

    await this.userService.updateWalletBalance(
      publicKey,
      TRUMP_MINT,
      newTrumpBalance,
    );

    this.logger.debug(
      `Updated wallet balance: SOL ${newSolBalance}, TRUMP ${newTrumpBalance}`,
    );
  }
}
