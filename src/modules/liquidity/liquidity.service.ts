// src/modules/liquidity/liquidity.service.ts
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
import { LiquidityHistory } from './entities/liquidity-history.entity';
import { PoolMonitoringService } from '../pool-monitoring/pool-monitoring.service';
import { ElizaAgentService } from 'src/services/eliza-agent.service';
import { fromSmallestUnit } from 'src/shared/utils';
import { ConfigResponseDto } from './dtos/config-response.dto';

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);
  private readonly trumpSolPoolId: string;

  constructor(
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    @InjectRepository(LiquidityHistory)
    private readonly liquidityHistoryRepository: Repository<LiquidityHistory>,
    private readonly poolMonitoringService: PoolMonitoringService,
    private readonly raydiumClmmService: RaydiumClmmService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly elizaAgentService: ElizaAgentService,
  ) {
    this.trumpSolPoolId = this.configService.get<string>(
      'POOL_ID',
      'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW',
    );
  }

  async getLiquidityHistory(publicKey: string, limit = 20) {
    return this.liquidityHistoryRepository.find({
      where: { publicKey },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async checkAndTriggerAutoLiquidity() {
    const activeUsers = await this.userConfigRepository.find({
      where: { status: 'active' },
    });
    if (activeUsers.length === 0) return;

    const currentPrice = await this.poolMonitoringService.getCurrentPrice(
      this.trumpSolPoolId,
    );
    if (!currentPrice) return;

    for (const userConfig of activeUsers) {
      const {
        publicKey,
        stepPercentage,
        triggeredPrice,
        addLiquidityAmount,
        minPrice,
        maxPrice,
      } = userConfig;

      const upThreshold = triggeredPrice * (1 + stepPercentage / 100);
      const downThreshold = triggeredPrice * (1 - stepPercentage / 100);

      if (currentPrice >= upThreshold || currentPrice <= downThreshold) {
        const res = await this.increaseSingleSidedLiquidity(publicKey);

        userConfig.triggeredPrice = currentPrice;
        await this.userConfigRepository.save(userConfig);

        await this.liquidityHistoryRepository.save({
          publicKey,
          price: currentPrice,
          solAmount: res.addLiquidity.solAmount,
          tokenAmount: res.addLiquidity.tokenAmount,
          swapTokenAmount: res.swap.inputTokenAmount,
          minPrice,
          maxPrice,
        });

        this.logger.log(`[Auto LP] ✅ ${publicKey} at ${currentPrice}`);
      }
    }
  }

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

  async getAiConfigRecommender(publicKey: string): Promise<ConfigResponseDto> {
    const tokenAmount = await this.userService.getBalanceByToken(
      publicKey,
      TRUMP_MINT,
    );

    this.logger.debug(`[getAiConfigRecommender] Token amount: ${tokenAmount}`);

    const recommendedConfig = await this.elizaAgentService.sendMessageToAgent(
      tokenAmount,
      'TRUMP',
    );

    return {
      walletAddress: publicKey,
      tokenAmount: tokenAmount,
      tokenSymbol: 'TRUMP',
      ...recommendedConfig,
    };
  }
}
