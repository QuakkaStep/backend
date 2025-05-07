import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('user_configs')
export class UserConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  publicKey: string;

  @Column({ type: 'varchar', length: 100 })
  poolId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  stepPercentage: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  perAddedLiquidity: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  triggeredPrice: number;

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
