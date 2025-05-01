// src/common/utils/solana-wallet.ts

import { Keypair } from '@solana/web3.js';

export const TRUMP_MINT = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
/**
 * 生成一个新的Solana钱包
 */
export function generateSolanaWallet() {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58(),     // 公钥（地址）
    secretKey: Buffer.from(keypair.secretKey).toString('hex'), // 私钥（Hex格式）
  };
}
