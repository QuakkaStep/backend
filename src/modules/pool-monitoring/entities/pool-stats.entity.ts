import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pool_stats')
export class PoolStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  poolId: string;

  @Column('decimal', { precision: 20, scale: 4 })
  liquidity: number; // TVL

  @Column('decimal', { precision: 20, scale: 4 })
  volume24h: number; // Volume 24H

  @Column('decimal', { precision: 20, scale: 4 })
  fees24h: number; // Fees 24H

  @CreateDateColumn()
  createdAt: Date;
}
