import { Injectable } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  Account,
  getMint,
} from '@solana/spl-token';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SolanaService {
  private readonly connection: Connection;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL');
    this.connection = new Connection(rpcUrl!, 'confirmed');
  }

  async getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<number> {
    const ata = await getAssociatedTokenAddress(mint, owner);
    try {
      const accountInfo: Account = await getAccount(this.connection, ata);
      const mintInfo = await getMint(this.connection, mint);
      return Number(accountInfo.amount) / 10 ** mintInfo.decimals;
    } catch (e) {
      if (e.message.includes('Token account not found')) return 0;
      throw e;
    }
  }

  async getSolBalance(owner: PublicKey): Promise<number> {
    const lamports = await this.connection.getBalance(owner);
    return lamports / 1e9;
  }

  async getAtaAddress(owner: PublicKey, mint: PublicKey): Promise<PublicKey> {
    return await getAssociatedTokenAddress(mint, owner);
  }

  async tokenAccountExists(
    owner: PublicKey,
    mint: PublicKey,
  ): Promise<boolean> {
    const ata = await getAssociatedTokenAddress(mint, owner);
    try {
      await getAccount(this.connection, ata);
      return true;
    } catch {
      return false;
    }
  }
}
