import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('user_configs')
export class UserConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  publicKey: string; // 直接存publicKey（可以考虑ManyToOne Wallet）

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  stepPercentage: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  addLiquidityAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  priceRange: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  minPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  maxPrice: number;

  @Column({ type: 'enum', enum: ['active', 'paused'], default: 'active' })
  status: 'active' | 'paused';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
