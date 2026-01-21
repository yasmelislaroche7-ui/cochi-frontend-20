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
  TOKEN_DECIMALS,
  TOKEN_SYMBOL,
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

  const fetchStakingData = useCallback(async (userAddress: string) => {
    try {
      console.log("Fetching staking data for:", userAddress);
      const [userInfo, apr, tokenBalance] = await Promise.all([
        publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: stakingAbi,
          functionName: "getUserInfo",
          args: [userAddress as `0x${string}`],
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
          args: [userAddress as `0x${string}`],
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
        apr: apr || 500n,
        isUnlocked,
        isConnected: true,
        address: userAddress,
      }));
    } catch (error: any) {
      console.error("Error fetching staking data:", error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
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

      const payload = res.finalPayload as any;
      const address = payload.address || (MiniKit as any).walletAddress;

      if (!address) {
        throw new Error("Wallet address not found")
      }

      await fetchStakingData(address);
      return address;
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      if ((MiniKit as any).walletAddress) {
        await fetchStakingData((MiniKit as any).walletAddress);
        return (MiniKit as any).walletAddress;
      }
      throw error;
    }
  }, [fetchStakingData]);

  const stake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const tokenAddress = TOKEN_CONTRACT_ADDRESS as `0x${string}`;
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`;

      console.log("Checking allowance for:", data.address);
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [data.address as `0x${string}`, stakingAddress],
      }) as bigint;

      console.log("Current allowance:", allowance.toString(), "Requested amount:", amount.toString());

      const transactions: any[] = [];

      if (allowance < amount) {
        console.log("Insufficient allowance, adding approve transaction");
        transactions.push({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [stakingAddress, amount.toString()],
        });
      }

      transactions.push({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount.toString()],
      });

      console.log("Sending transactions:", transactions);
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      });

      console.log("MiniKit transaction result:", finalPayload);

      if (finalPayload.status === "error") {
        const errorMsg = finalPayload.error_code || "Transaction failed";
        console.error("Transaction Error Detail:", finalPayload);
        throw new Error(errorMsg);
      }

      // Refresh data after a small delay to allow node synchronization
      setTimeout(() => {
        if (data.address) fetchStakingData(data.address);
      }, 3000);

      await fetchStakingData(data.address);
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
      await fetchStakingData(data.address);
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
      await fetchStakingData(data.address);
      return finalPayload.transaction_id;
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!MiniKit.isInstalled()) return;
    const existing = (MiniKit as any).walletAddress;
    if (existing && !data.isConnected) {
      fetchStakingData(existing);
    }
  }, [data.isConnected, fetchStakingData]);

  return {
    ...data,
    loading,
    connectWallet,
    stake,
    unstake,
    claim,
    refreshData: () => data.address && fetchStakingData(data.address),
  };
}
