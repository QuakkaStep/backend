import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Raydium } from './type';

@Injectable()
export class RaydiumApiService {
  private readonly logger = new Logger(RaydiumApiService.name);
  private readonly trumpSolPoolId: string;
  private readonly raydiumApiUrl: string;
  private readonly poolInfoEndpoint: string;
  private readonly mintPriceEndpoint: string;
  private readonly trumpMint: string;
  private readonly solMint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.trumpSolPoolId = this.configService.get<string>(
      'POOL_ID',
      'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW',
    );
    this.raydiumApiUrl = this.configService.get<string>(
      'RAYDIUM_API_URL',
      'https://api-v3.raydium.io/',
    );
    this.poolInfoEndpoint = this.configService.get<string>(
      'RAYDIUM_POOL_INFO',
      'pools/info/ids',
    );
    this.mintPriceEndpoint = this.configService.get<string>(
      'RAYDIUM_MINT_PRICE',
      'mint/price',
    );
    this.trumpMint = this.configService.get<string>(
      'TRUMP_MINT',
      '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    );
    this.solMint = this.configService.get<string>(
      'SOL_MINT',
      'So11111111111111111111111111111111111111112',
    );
  }

  async fetchPoolInfo(poolId: string): Promise<Raydium.PoolInfo> {
    try {
      const url = `${this.raydiumApiUrl}${this.poolInfoEndpoint}?ids=${poolId}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const poolInfo = response.data.data[0]; // 只取第一个池子
      if (!poolInfo) {
        throw new Error('Pool info not found');
      }
      return poolInfo;
    } catch (error) {
      this.logger.error('Error fetching pool info', error);
      throw new Error('Error fetching pool info');
    }
  }

  async fetchTrumpPrice() {
    try {
      const url = `${this.raydiumApiUrl}${this.mintPriceEndpoint}?mints=${this.trumpMint}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const price = response.data?.data?.[this.trumpMint];
      if (!price) {
        throw new Error('Price for TRUMP not found');
      }
      return price;
    } catch (error) {
      this.logger.error('Error fetching TRUMP price', error);
      throw new Error('Error fetching TRUMP price');
    }
  }

  async fetchSolPrice() {
    try {
      const url = `${this.raydiumApiUrl}${this.mintPriceEndpoint}?mints=${this.solMint}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const price = response.data?.data?.[this.solMint];
      if (!price) {
        throw new Error('Price for SOL not found');
      }
      return price;
    } catch (error) {
      this.logger.error('Error fetching SOL price', error);
      throw new Error('Error fetching SOL price');
    }
  }
}
