import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('wallet_balance')
export class WalletBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  owner: string; // 用户的钱包公钥

  @Column()
  tokenMint: string; // 代币地址，例如 SOL 或 TRUMP

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  balance: number;
}
