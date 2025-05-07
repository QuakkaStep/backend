import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateSolanaWallet, SOL_MINT, TRUMP_MINT } from '../common/utils';
import { LiquidityService } from '../liquidity/liquidity.service';
import {
  InitUserConfigDto
} from './dtos/create-user-config.dto';
import { UserConfig } from './entities/user-config.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Wallet } from './entities/wallet.entity';

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
    private readonly liquidityService: LiquidityService,
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
}
