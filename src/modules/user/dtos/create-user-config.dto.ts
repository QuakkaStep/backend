import { IsInt, IsDecimal, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserConfigDto {
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @IsDecimal()
  stepPercentage: number;

  @IsDecimal()
  addLiquidityAmount: number;

  @IsDecimal()
  minPrice: number;

  @IsDecimal()
  maxPrice: number;
}
