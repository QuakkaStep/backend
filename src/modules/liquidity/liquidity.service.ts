import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicKey } from '@solana/web3.js';
import { ElizaAgentService } from 'src/services/eliza-agent.service';
import { RaydiumClmmService } from 'src/services/raydium.clmm.service';
import { ComputeLiquidityResult } from 'src/services/type';
import { Repository } from 'typeorm';
import { SOL_MINT, TRUMP_MINT } from '../common/utils';
import { PoolMonitoringService } from '../pool-monitoring/pool-monitoring.service';
import { UserConfig } from '../user/entities/user-config.entity';
import { UserService } from '../user/user.service';
import { ConfigResponseDto } from './dtos/config-response.dto';
import { LiquidityHistory } from './entities/liquidity-history.entity';
import { RaydiumApiService } from 'src/services/raydium.api.service';

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);

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
    private readonly raydiumApiService: RaydiumApiService,
  ) {}

  async getLiquidityHistory(publicKey: string, limit = 20) {
    return this.liquidityHistoryRepository.find({
      where: { publicKey },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async timedCheckAddLiquidity() {
    const activeConfigs = await this.userConfigRepository.find({
      where: { status: 'active' },
    });
    if (activeConfigs.length === 0) return;

    for (const config of activeConfigs) {
      const {
        publicKey,
        poolId,
        stepPercentage,
        triggeredPrice,
        perAddedLiquidity,
        minPrice,
        maxPrice,
      } = config;

      const {
        price: curTokenPrice,
        symbol,
        tokenAddr,
      } = await this.poolMonitoringService.getTokenInfo(poolId);

      const isValidPrice =
        curTokenPrice >= minPrice && curTokenPrice <= maxPrice;

      if (!isValidPrice) {
        await this.userConfigRepository.update(config.id, {
          status: 'paused',
        });
        this.logger.log(
          `[Auto LP] ❌ ${publicKey} ${symbol} at ${curTokenPrice} is out of range [${minPrice}, ${maxPrice}]`,
        );
        continue;
      }

      const upThreshold = triggeredPrice * (1 + stepPercentage / 100);
      const downThreshold = triggeredPrice * (1 - stepPercentage / 100);

      const shouldTrigger =
        triggeredPrice === 0 ||
        curTokenPrice >= upThreshold ||
        curTokenPrice <= downThreshold;

      this.logger.debug(
        `shouldTrigger: ${shouldTrigger}, triggeredPrice: ${triggeredPrice}, curTokenPrice: ${curTokenPrice}, upThreshold: ${upThreshold}, downThreshold: ${downThreshold}`,
      );

      if (shouldTrigger) {
        if (Number(triggeredPrice) !== 0) {
          const configDto = await this.aiConfigGeneration(publicKey, tokenAddr);
          await this.userConfigRepository.update(config.id, {
            stepPercentage: configDto.stepPercentage,
            perAddedLiquidity: configDto.addLiquidityAmount,
          });

          this.logger.log(
            `[Auto LP][AI Config] 🤖 Updated config for ${publicKey}: step=${configDto.stepPercentage}, amount=${configDto.addLiquidityAmount}`,
          );
        }

        await this.increaseSingleSidedLiquidity(
          publicKey,
          tokenAddr,
          poolId,
          curTokenPrice,
        );

        await this.userConfigRepository.update(config.id, {
          triggeredPrice: curTokenPrice,
        });
      }
    }
  }

  private async increaseSingleSidedLiquidity(
    publicKey: string,
    tokenAddr: string,
    poolId: string,
    curTokenPrice?: number,
  ) {
    const userConfig = await this.userConfigRepository.findOne({
      where: { publicKey, poolId },
    });
    if (!userConfig) {
      throw new Error(`User ${publicKey} config not found`);
    }
    const { minPrice, maxPrice, perAddedLiquidity } = userConfig;

    const increaseLiquidityRes =
      await this.raydiumClmmService.computeSingleSidedLiquidity(
        new PublicKey(publicKey),
        perAddedLiquidity,
        minPrice,
        maxPrice,
        poolId,
      );

    await this.updateBalances(publicKey, tokenAddr, increaseLiquidityRes);

    await this.liquidityHistoryRepository.save({
      publicKey,
      poolId,
      price: curTokenPrice,
      solAmount: increaseLiquidityRes.addLiquidity.solAmount,
      tokenAmount: increaseLiquidityRes.addLiquidity.tokenAmount,
      swapTokenAmount: increaseLiquidityRes.swap.inputTokenAmount,
      minPrice,
      maxPrice,
    });
  }

  private async updateBalances(
    publicKey: string,
    tokenAddr: string,
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

    await this.userService.updateWalletBalance(
      publicKey,
      SOL_MINT,
      newSolBalance,
    );

    this.logger.debug(
      `Updated SOL balance: ${solBalance} --> ${newSolBalance}`,
    );

    // Update token balance
    const tokenBalance = await this.userService.getBalanceByToken(
      publicKey,
      tokenAddr,
    );
    const inputTokenAmount = Number(increaseRes.swap.inputTokenAmount);
    const addTokenAmount = Number(increaseRes.addLiquidity.tokenAmount);

    const newTokenBalance = tokenBalance - (inputTokenAmount + addTokenAmount);

    await this.userService.updateWalletBalance(
      publicKey,
      tokenAddr,
      newTokenBalance,
    );

    this.logger.debug(
      `Updated token balance: ${tokenBalance} --> ${newTokenBalance}`,
    );
  }

  async aiConfigGeneration(
    publicKey: string,
    tokenAddr: string,
  ): Promise<ConfigResponseDto> {
    const tokenAmount = await this.userService.getBalanceByToken(
      publicKey,
      tokenAddr,
    );

    const tokenInfo = await this.raydiumApiService.fetchTokenInfo(tokenAddr);

    const recommendedConfig = await this.elizaAgentService.sendMsg(
      tokenAmount,
      tokenInfo.symbol,
    );

    return {
      walletAddress: publicKey,
      tokenAmount: tokenAmount,
      tokenSymbol: tokenInfo.symbol,
      ...recommendedConfig,
    };
  }
}
