"use client";

import { useCallback, useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { createPublicClient, http } from "viem";
import { worldchain } from "viem/chains";

import stakingAbi from "@/lib/contracts/staking-abi.json";
import erc20Abi from "@/lib/contracts/erc20-abi.json";
import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from "@/lib/contracts/config";

/* ───────────────── TYPES ───────────────── */

export interface WalletState {
  address: string | null;
  connected: boolean;
}

export interface TxResult {
  transactionId: string;
}

/* ───────────────── CLIENT ───────────────── */

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
});

/* ───────────────── HOOK ───────────────── */

export function useStaking() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    connected: false,
  });

  const [loading, setLoading] = useState(false);

  /* ───────────── CONNECT ───────────── */

  const connectWallet = useCallback(async (): Promise<string> => {
    if (!MiniKit.isInstalled()) {
      throw new Error("World App not installed");
    }

    const res = await MiniKit.commandsAsync.walletAuth({
      requestId: "connect-staking",
      nonce: crypto.randomUUID(),
      statement: "Connect to Matrix Staking",
      expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (res.finalPayload.status === "error") {
      throw new Error("Wallet auth failed");
    }

    const address =
      (res.finalPayload as any).address ||
      (MiniKit as any).walletAddress;

    if (!address) {
      throw new Error("Wallet address not found");
    }

    setWallet({ address, connected: true });
    return address;
  }, []);

  /* ───────────── APPROVE ───────────── */

  const approve = useCallback(
    async (amount: bigint): Promise<TxResult> => {
      if (!wallet.address) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const { finalPayload } =
          await MiniKit.commandsAsync.sendTransaction({
            transaction: [
              {
                address: TOKEN_CONTRACT_ADDRESS,
                abi: erc20Abi,
                functionName: "approve",
                args: [STAKING_CONTRACT_ADDRESS, amount.toString()],
              },
            ],
          });

        if (finalPayload.status === "error") {
          throw new Error("Approve transaction failed");
        }

        return { transactionId: finalPayload.transaction_id };
      } finally {
        setLoading(false);
      }
    },
    [wallet.address]
  );

  /* ───────────── STAKE ───────────── */

  const stake = useCallback(
    async (amount: bigint): Promise<TxResult> => {
      if (!wallet.address) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const { finalPayload } =
          await MiniKit.commandsAsync.sendTransaction({
            transaction: [
              {
                address: STAKING_CONTRACT_ADDRESS,
                abi: stakingAbi,
                functionName: "stake",
                args: [amount.toString()],
              },
            ],
          });

        if (finalPayload.status === "error") {
          throw new Error("Stake transaction failed");
        }

        return { transactionId: finalPayload.transaction_id };
      } finally {
        setLoading(false);
      }
    },
    [wallet.address]
  );

  /* ───────────── CLAIM ───────────── */

  const claim = useCallback(async (): Promise<TxResult> => {
    if (!wallet.address) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const { finalPayload } =
        await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: STAKING_CONTRACT_ADDRESS,
              abi: stakingAbi,
              functionName: "claim",
              args: [],
            },
          ],
        });

      if (finalPayload.status === "error") {
        throw new Error("Claim failed");
      }

      return { transactionId: finalPayload.transaction_id };
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  /* ───────────── AUTO RECONNECT ───────────── */

  useEffect(() => {
    if (!MiniKit.isInstalled()) return;

    const existing = (MiniKit as any).walletAddress;
    if (existing && !wallet.connected) {
      setWallet({
        address: existing,
        connected: true,
      });
    }
  }, [wallet.connected]);

  /* ───────────── EXPORT ───────────── */

  return {
    wallet,
    loading,

    connectWallet,
    approve,
    stake,
    claim,
  };
}