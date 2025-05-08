import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  calculateDeltaL,
  calculateUserAprAndFee,
  generateSolanaWallet,
  SOL_MINT,
  TRUMP_MINT,
} from '../common/utils';
import { LiquidityService } from '../liquidity/liquidity.service';
import { InitUserConfigDto } from './dtos/create-user-config.dto';
import { UserConfig } from './entities/user-config.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Wallet } from './entities/wallet.entity';
import { LiquidityHistory } from '../liquidity/entities/liquidity-history.entity';
import { RaydiumApiService } from 'src/services/raydium.api.service';
import { PortfolioItem } from './types';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private readonly walletBalanceRepo: Repository<WalletBalance>,
    @InjectRepository(LiquidityHistory)
    private readonly liquidityHistoryRepo: Repository<LiquidityHistory>,
    private readonly raydiumApiService: RaydiumApiService,
  ) {}

  async saveConfig(config: InitUserConfigDto) {
    const userIsExist = await this.userIsExist(config.publicKey);
    if (!userIsExist) {
      throw new BadRequestException(
        `wallet ${config.publicKey} not generated on this server`,
      );
    }

    const configIsExist = await this.userConfigRepository.exists({
      where: { publicKey: config.publicKey, poolId: config.poolId },
    });

    if (configIsExist) {
      throw new BadRequestException(
        `user config for ${config.publicKey} already exists`,
      );
    }

    const userConfig = this.userConfigRepository.create(config);
    await this.userConfigRepository.save(userConfig);

    return userConfig;
  }

  async generateWallet() {
    const { publicKey, secretKey } = generateSolanaWallet();
    this.logger.log(`[generateWallet] Generated wallet: ${publicKey}`);

    await this.walletRepo.save({ publicKey, secretKey });

    const solBalance = this.walletBalanceRepo.create({
      owner: publicKey,
      tokenMint: SOL_MINT,
      balance: 1,
    });

    const trumpBalance = this.walletBalanceRepo.create({
      owner: publicKey,
      tokenMint: TRUMP_MINT,
      balance: 100,
    });

    await this.walletBalanceRepo.save([solBalance, trumpBalance]);

    return {
      publicKey,
      secretKey,
    };
  }

  private async userIsExist(publicKey: string) {
    const userIsExist = await this.walletRepo.exists({
      where: {
        publicKey: publicKey,
      },
    });

    return userIsExist;
  }

  async updateWalletBalance(
    publicKey: string,
    tokenMint: string,
    newBalance: number,
  ): Promise<WalletBalance> {
    const wallet = await this.walletRepo.findOne({ where: { publicKey } });
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    let balanceRecord = await this.walletBalanceRepo.findOne({
      where: {
        owner: publicKey,
        tokenMint,
      },
    });

    if (balanceRecord) {
      balanceRecord.balance = newBalance;
    } else {
      balanceRecord = this.walletBalanceRepo.create({
        owner: publicKey,
        tokenMint,
        balance: newBalance,
      });
    }

    return this.walletBalanceRepo.save(balanceRecord);
  }

  async getBalanceByToken(
    publicKey: string,
    tokenMint: string,
  ): Promise<number> {
    const balanceRecord = await this.walletBalanceRepo.findOne({
      where: {
        owner: publicKey,
        tokenMint,
      },
    });

    if (!balanceRecord) {
      throw new BadRequestException('Wallet or token balance not found.');
    }

    return Number(balanceRecord.balance);
  }

  async getAllTokenBalances(publicKey: string): Promise<WalletBalance[]> {
    const balances = await this.walletBalanceRepo.find({
      where: { owner: publicKey },
    });

    if (!balances || balances.length === 0) {
      throw new BadRequestException('No token balances found for this wallet.');
    }

    return balances;
  }

  async getFullPortfolio(publicKey: string): Promise<PortfolioItem[]> {
    const histories = await this.liquidityHistoryRepo.find({
      where: { publicKey },
    });

    // 分组 histories（按 poolId）
    const grouped = histories.reduce(
      (acc, record) => {
        if (!acc[record.poolId]) acc[record.poolId] = [];
        acc[record.poolId].push(record);
        return acc;
      },
      {} as Record<string, LiquidityHistory[]>,
    );

    const solPrice = await this.raydiumApiService.fetchTokenPrice(SOL_MINT);

    const results: PortfolioItem[] = [];

    for (const poolId of Object.keys(grouped)) {
      const poolHistories = grouped[poolId];
      const poolResult = await this.calcUserAprForPool(
        poolId,
        poolHistories,
        solPrice,
      );
      results.push({ poolId, ...poolResult });
    }

    return results;
  }

  private async calcUserAprForPool(
    poolId: string,
    histories: LiquidityHistory[],
    solPrice: number,
  ) {
    let totalTokenAmount = 0;
    let totalSolAmount = 0;

    for (const record of histories) {
      totalTokenAmount += Number(record.tokenAmount);
      totalSolAmount += Number(record.solAmount);
    }

    const minPrice = Number(histories[0].minPrice);
    const maxPrice = Number(histories[0].maxPrice);

    const currentPrice = 1 / Number(histories[histories.length - 1].price);
    const tokenPriceInUsd = currentPrice * solPrice;
    const tokenUpPrice = (1 / minPrice) * solPrice;
    const tokenDownPrice = (1 / maxPrice) * solPrice;

    const deltaL = calculateDeltaL(
      totalSolAmount,
      totalTokenAmount,
      tokenUpPrice,
      tokenDownPrice,
      tokenPriceInUsd,
    );

    const poolInfo = await this.raydiumApiService.fetchPoolInfo(poolId);
    const userTotalValueUSD =
      totalSolAmount * solPrice + totalTokenAmount * tokenPriceInUsd;

    const { userApr, expectedDailyFee } = calculateUserAprAndFee(
      deltaL,
      poolInfo.tvl,
      poolInfo.day.volume,
      poolInfo.feeRate,
      userTotalValueUSD,
    );

    return {
      userApr,
      expectedDailyFee,
      userTotalValueUSD,
    };
  }
}
