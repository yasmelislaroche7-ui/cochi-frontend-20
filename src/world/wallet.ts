// src/world/wallet.ts
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { WORLDCHAIN } from "../config/world";

/**
 * Public client (READ)
 * Usado para:
 * - readContract
 * - waitForTransactionReceipt
 * - getChainId
 */
export const publicClient = createPublicClient({
  chain: {
    id: WORLDCHAIN.chainId,
    name: WORLDCHAIN.name,
    nativeCurrency: {
      name: "Worldchain",
      symbol: "WLD", // World App usa WLD, NO ETH
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [WORLDCHAIN.rpcUrl],
      },
    },
  },
  transport: http(WORLDCHAIN.rpcUrl),
});

/**
 * Wallet client (WRITE)
 * World App injecta provider compatible con viem
 */
export const walletClient = createWalletClient({
  chain: {
    id: WORLDCHAIN.chainId,
    name: WORLDCHAIN.name,
    nativeCurrency: {
      name: "Worldchain",
      symbol: "WLD",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [WORLDCHAIN.rpcUrl],
      },
    },
  },
  transport: typeof window !== "undefined" && (window as any).ethereum
    ? custom((window as any).ethereum)
    : http(WORLDCHAIN.rpcUrl),
});