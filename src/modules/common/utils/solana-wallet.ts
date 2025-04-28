// src/common/utils/solana-wallet.ts

import { Keypair } from '@solana/web3.js';

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
