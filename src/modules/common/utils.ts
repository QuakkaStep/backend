import { Keypair } from '@solana/web3.js';

export const TRUMP_MINT = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const TRUMP_SOL_POOL_ID = 'GQsPr4RJk9AZkkfWHud7v4MtotcxhaYzZHdsPCg9vNvW';

export function generateSolanaWallet() {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Buffer.from(keypair.secretKey).toString('hex'),
  };
}

export function toSmallestUnit(amount: number, decimals: number): number {
  return amount * 10 ** decimals;
}

export function fromSmallestUnit(
  smallestAmount: number,
  decimals: number,
): number {
  return smallestAmount / 10 ** decimals;
}

export function calculateDeltaL(
  tokenAmountA: number, // WSOL
  tokenAmountB: number, // TRUMP
  Pu: number,
  Pl: number,
  P: number,
): number {
  console.log('[calculateDeltaL] Inputs:', {
    tokenAmountA,
    tokenAmountB,
    Pu,
    Pl,
    P,
  });

  if (Pl >= Pu || P < Pl || P > Pu) {
    console.log(
      '[calculateDeltaL] Invalid price range:',
      `Pl >= Pu: ${Pl >= Pu}, P < Pl: ${P < Pl}, P > Pu: ${P > Pu}`,
    );
    return 0;
  }

  const sqrtPl = Math.sqrt(Pl);
  const sqrtPu = Math.sqrt(Pu);
  const sqrtP = Math.sqrt(P);

  let deltaL = 0;

  if (P <= Pl) {
    deltaL = tokenAmountA / (1 / sqrtPl - 1 / sqrtPu);
    console.log('[calculateDeltaL] Case: P <= Pl, deltaL =', deltaL);
  } else if (P >= Pu) {
    deltaL = tokenAmountB / (sqrtPu - sqrtPl);
    console.log('[calculateDeltaL] Case: P >= Pu, deltaL =', deltaL);
  } else {
    const deltaLA = tokenAmountA / (1 / sqrtP - 1 / sqrtPu);
    const deltaLB = tokenAmountB / (sqrtP - sqrtPl);
    deltaL = Math.min(deltaLA, deltaLB);
    console.log(
      '[calculateDeltaL] Case: Pl < P < Pu, deltaLA =',
      deltaLA,
      ', deltaLB =',
      deltaLB,
      ', deltaL =',
      deltaL,
    );
  }

  return deltaL;
}


export function calculateUserAprAndFee(
  deltaL: number,
  totalL: number,
  dailyVolumeUSD: number,
  feeRate: number,
  userTotalValueUSD: number,
): {
  userApr: number;
  expectedDailyFee: number;
} {
  if (deltaL <= 0 || totalL <= 0 || userTotalValueUSD <= 0) {
    return {
      userApr: 0,
      expectedDailyFee: 0,
    };
  }

  const liquidityShare = deltaL / totalL;
  const dailyFeeUSD = dailyVolumeUSD * feeRate * liquidityShare;

  const userApr = (dailyFeeUSD / userTotalValueUSD) * 365;

  return {
    userApr,
    expectedDailyFee: dailyFeeUSD,
  };
}
