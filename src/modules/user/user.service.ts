import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserConfigDto } from './dtos/create-user-config.dto';
import { Wallet } from './entities/wallet.entity';
import { generateSolanaWallet } from '../common/utils/solana-wallet';
import { UserConfig } from './entities/user-config.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async saveConfig(
    createUserConfigDto: CreateUserConfigDto,
  ): Promise<UserConfig> {
    const userIsExist = await this.userIsExist(createUserConfigDto.publicKey);
    if (!userIsExist) {
      this.logger.error('[saveConfig] User already exists');
      throw new BadRequestException('Wallet not found. Please generate wallet first.');
    }
    const userConfig = this.userConfigRepository.create(createUserConfigDto);
    return await this.userConfigRepository.save(userConfig);
  }

  async generateWallet() {
    const { publicKey, secretKey } = generateSolanaWallet();
    this.logger.log(`[generateWallet] Generated wallet: ${publicKey}`);
    await this.walletRepo.save({ publicKey, secretKey });
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
}
