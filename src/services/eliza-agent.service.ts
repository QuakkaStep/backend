import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Elizaos } from './type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElizaAgentService {
  private readonly logger = new Logger(ElizaAgentService.name);
  private readonly elizaBaseUrl;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.elizaBaseUrl = this.configService.get<string>(
      'ELIZA_SERVICE_BASE_URL',
      'http://localhost:3000',
    );
  }

  private async fetchElizaAgentId(): Promise<string> {
    try {
      const url = `${this.elizaBaseUrl}/agents`;
      this.logger.debug(`Fetching Eliza agent ID from ${url}`);
      const response = await firstValueFrom(
        this.httpService.get<Elizaos.AgentResponse>(url),
      );

      const elizaAgent = response.data.agents.find(
        (agent) => agent.name === 'Eliza',
      );
      if (!elizaAgent) {
        throw new Error('Eliza agent not found');
      }
      return elizaAgent.id;
    } catch (error) {
      this.logger.error('Failed to fetch Eliza agent ID', error.message);
      throw new Error('Could not retrieve Eliza agent ID');
    }
  }

  async sendMsg(
    tokenAmount: number,
    tokenSymbol: string,
  ): Promise<Elizaos.CLMMConfig> {
    try {
      const agentId = await this.fetchElizaAgentId();

      let prompt = `Generate a Raydium CLMM config for my ${tokenSymbol}/SOL pool. My wallet has ${tokenAmount} ${tokenSymbol}`;

      const response = await firstValueFrom(
        this.httpService.post<Elizaos.ElizaResponseItem[]>(
          `${this.elizaBaseUrl}/${agentId}/message`,
          {
            text: prompt,
          },
        ),
      );

      const configItem = response.data.find((item) => item.content?.config);

      if (!configItem || !configItem.content?.config) {
        throw new Error('No CLMM config found in Eliza response');
      }

      return configItem?.content?.config;
    } catch (error) {
      throw new Error('Failed to send message to Eliza agent');
    }
  }
}
