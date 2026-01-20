"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, formatUnits } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"
import stakingAbi from "@/lib/contracts/staking-abi.json"
import erc20Abi from "@/lib/contracts/erc20-abi.json"
import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
} from "@/lib/contracts/config"

export interface StakingData {
  stakedBalance: bigint;
  availableBalance: bigint;
  pendingRewards: bigint;
  unlockTime: bigint;
  apr: bigint;
  isUnlocked: boolean;
  isConnected: boolean;
  address: string | null;
}

export function useStaking() {
  const [data, setData] = useState<StakingData>({
    stakedBalance: 0n,
    availableBalance: 0n,
    pendingRewards: 0n,
    unlockTime: 0n,
    apr: 0n,
    isUnlocked: true,
    isConnected: false,
    address: null,
  });
  const [loading, setLoading] = useState(false);

  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
    batch: {
      multicall: true,
    },
  });

  const connectWallet = useCallback(async () => {
    console.log("Attempting to connect wallet...")
    if (typeof window === "undefined") return null;
    
    try {
      const res = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: "0",
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(),
        statement: "Connect to Matrix Stake",
      });

      if (res.finalPayload.status === "error") {
        throw new Error(res.finalPayload.error_code || "Wallet connection failed")
      }

      // Safe access to address for latest MiniKit types
      const payload = res.finalPayload as any;
      const address = payload.address || (MiniKit as any).walletAddress;
      console.log("Connected address:", address)

      if (!address) {
        throw new Error("Connection successful but no address found")
      }

      setData((prev) => ({
        ...prev,
        isConnected: true,
        address: address,
      }));

      return address;
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      // Fallback check
      if ((MiniKit as any).walletAddress) {
        setData((prev) => ({
          ...prev,
          isConnected: true,
          address: (MiniKit as any).walletAddress,
        }));
        return (MiniKit as any).walletAddress;
      }
      throw error;
    }
  }, []);

  // Helper: MAX_UINT256
  const MAX_UINT256 = (1n << 256n) - 1n;

  // Fetch user staking data
  const fetchStakingData = useCallback(async () => {
    if (!data.address) return;

    try {
      console.log("Fetching staking data for:", data.address);
      const [userInfo, apr, tokenBalance] = await Promise.all([
        publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: stakingAbi,
          functionName: "getUserInfo",
          args: [data.address as `0x${string}`],
        }) as Promise<[bigint, bigint, bigint, bigint]>,
        publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: stakingAbi,
          functionName: "apr",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [data.address as `0x${string}`],
        }) as Promise<bigint>,
      ]);

      const [staked, pending, unlockTime] = userInfo || [0n, 0n, 0n];
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const isUnlocked = currentTime >= (unlockTime || 0n);

      setData((prev) => ({
        ...prev,
        stakedBalance: staked || 0n,
        pendingRewards: pending || 0n,
        unlockTime: unlockTime || 0n,
        availableBalance: tokenBalance || 0n,
        apr: (apr && apr > 0n) ? apr : 500n,
        isUnlocked,
      }));
    } catch (error: any) {
      console.error("Error fetching staking data:", error);
    }
  }, [data.address, publicClient]);

  const stake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      console.log("Preparing stake transaction for amount:", amount.toString());

      const tokenAddress = TOKEN_CONTRACT_ADDRESS as `0x${string}`;
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`;

      // We use commandsAsync.sendTransaction to bundle approve + stake together.
      // This is the cleanest way to ensure simulation success in World App.
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [stakingAddress, amount.toString()],
          },
          {
            address: stakingAddress,
            abi: stakingAbi,
            functionName: "stake",
            args: [amount.toString()],
          }
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transaction failed");
      }

      await fetchStakingData();
      return finalPayload.transaction_id;
    } catch (error: any) {
      console.error("Error staking:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unstake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`;

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: stakingAddress,
            abi: stakingAbi,
            functionName: "unstake",
            args: [amount.toString()],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transaction failed");
      }

      await fetchStakingData();
      return finalPayload.transaction_id;
    } catch (error: any) {
      console.error("Error unstaking:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const claim = async () => {
    if (!data.address) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`;

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: stakingAddress,
            abi: stakingAbi,
            functionName: "claim",
            args: [],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transaction failed");
      }

      await fetchStakingData();
      return finalPayload.transaction_id;
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (data.isConnected) {
      fetchStakingData();
      const interval = setInterval(fetchStakingData, 10000);
      return () => clearInterval(interval);
    }
  }, [data.isConnected, fetchStakingData]);

  useEffect(() => {
    const checkWallet = async () => {
      if (MiniKit.isInstalled() && !data.isConnected) {
        try {
          // If walletAddress is already there, use it immediately
          if ((MiniKit as any).walletAddress) {
            setData((prev) => ({
              ...prev,
              isConnected: true,
              address: (MiniKit as any).walletAddress,
            }));
            return;
          }
          // Otherwise try auth
          await connectWallet();
        } catch (e) {
          console.error("Initial connection failed", e);
        }
      }
    };
    checkWallet();
  }, [connectWallet, data.isConnected]);

  return {
    ...data,
    loading,
    connectWallet,
    stake,
    unstake,
    claim,
    refreshData: fetchStakingData,
  };
}