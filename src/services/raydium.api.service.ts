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

  private async fetchWithRetry<T>(
    url: string,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await firstValueFrom(this.httpService.get(url));
        return response.data;
      } catch (error) {
        this.logger.warn(
          `Request failed (attempt ${attempt}/${retries}): ${url}`,
        );
        if (attempt === retries) {
          this.logger.error(`Failed after ${retries} retries`, error);
          throw new Error(`Request failed after ${retries} retries`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Unexpected error in fetchWithRetry');
  }

  async fetchPoolInfo(poolId: string): Promise<Raydium.PoolInfo> {
    const url = `${this.raydiumApiUrl}/pools/info/ids?ids=${poolId}`;
    const data = await this.fetchWithRetry<{ data: Raydium.PoolInfo[] }>(url);
    const poolInfo = data.data[0];
    if (!poolInfo) throw new Error('Pool info not found');
    return poolInfo;
  }

  async fetchTokenPrice(mint: string): Promise<number> {
    const url = `${this.raydiumApiUrl}/mint/price?mints=${mint}`;
    const data = await this.fetchWithRetry<{ data: Record<string, number> }>(
      url,
    );
    const price = data?.data?.[mint];
    if (!price) throw new Error(`Price for token ${mint} not found`);
    return price;
  }

  async fetchTokenInfo(tokenAddr: string): Promise<Raydium.TokenInfo> {
    const url = `${this.raydiumApiUrl}/mint/ids?mints=${tokenAddr}`;
    const data = await this.fetchWithRetry<{ data: Raydium.TokenInfo }>(url);
    return data.data;
  }
}
