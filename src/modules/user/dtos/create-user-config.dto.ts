import {
  IsInt,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class InitUserConfigDto {
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @IsNotEmpty()
  @IsString()
  poolId: string;

  @IsDecimal()
  stepPercentage: number;

  @IsDecimal()
  perAddedLiquidity: number;

  @IsDecimal()
  minPrice: number;

  @IsDecimal()
  maxPrice: number;
}
