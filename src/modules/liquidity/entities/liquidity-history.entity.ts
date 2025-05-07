// src/modules/user/entities/liquidity-history.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('liquidity_histories')
export class LiquidityHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  publicKey: string;

  @Column('varchar')
  poolId: string;

  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @Column('decimal', { precision: 18, scale: 8 })
  solAmount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  tokenAmount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  swapTokenAmount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  minPrice: number;

  @Column('decimal', { precision: 18, scale: 8 })
  maxPrice: number;

  @CreateDateColumn()
  createdAt: Date;
}

