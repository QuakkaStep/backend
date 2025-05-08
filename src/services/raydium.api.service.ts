import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Raydium } from './type';

@Injectable()
export class RaydiumApiService {
  private readonly logger = new Logger(RaydiumApiService.name);
  private readonly raydiumApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.raydiumApiUrl = this.configService.get<string>(
      'RAYDIUM_API_URL',
      'https://api-v3.raydium.io',
    );
  }

  async fetchPoolInfo(poolId: string): Promise<Raydium.PoolInfo> {
    try {
      const url = `${this.raydiumApiUrl}/pools/info/ids?ids=${poolId}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const poolInfo = response.data.data[0];
      if (!poolInfo) {
        throw new Error('Pool info not found');
      }
      return poolInfo;
    } catch (error) {
      this.logger.error('Error fetching pool info', error);
      throw new Error('Error fetching pool info');
    }
  }

  async fetchTokenPrice(mint: string): Promise<number> {
    try {
      const url = `${this.raydiumApiUrl}/mint/price?mints=${mint}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const price = response.data?.data?.[mint];
      if (!price) {
        throw new Error(`Price for token ${mint} not found`);
      }
      return price;
    } catch (error) {
      this.logger.error(`Error fetching price for mint ${mint}`, error);
      throw new Error(`Error fetching price for mint ${mint}`);
    }
  }
}
