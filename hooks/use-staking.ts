"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { worldchain } from "viem/chains";
import { MiniKit } from "@worldcoin/minikit-js";
import stakingAbi from "@/lib/contracts/staking-abi.json";
import erc20Abi from "@/lib/contracts/erc20-abi.json";
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "@/lib/contracts/config";

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
    console.log("Attempting to connect wallet...");
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
        throw new Error(res.finalPayload.error_code || "Wallet connection failed");
      }

      const payload = res.finalPayload as any;
      const address = payload.address || (MiniKit as any).walletAddress;
      console.log("Connected address:", address);

      if (!address) {
        throw new Error("Connection successful but no address found");
      }

      setData((prev) => ({
        ...prev,
        isConnected: true,
        address: address,
      }));

      return address;
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
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

      // 1) Check current allowance
      console.log("Checking allowance...");
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [data.address as `0x${string}`, stakingAddress],
      }) as Promise<bigint>;

      console.log("Current allowance:", allowance.toString());

      if (allowance < amount) {
        console.log("Allowance insufficient, sending approve...");
        const approveResult = await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [stakingAddress, amount.toString()],
            },
          ],
        });

        console.log("Approve finalPayload:", approveResult.finalPayload);

        if (approveResult.finalPayload.status === "error") {
          throw new Error(approveResult.finalPayload.error_code || "Approval failed");
        }

        // Re-check allowance to be safe
        const newAllowance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [data.address as `0x${string}`, stakingAddress],
        }) as Promise<bigint>;

        console.log("Allowance after approve:", newAllowance.toString());

        if (newAllowance < amount) {
          throw new Error("Allowance did not update to required amount after approve");
        }
      } else {
        console.log("Sufficient allowance detected, skipping approve.");
      }

      // 2) Now call stake in a separate transaction
      const stakeResult = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: stakingAddress,
            abi: stakingAbi,
            functionName: "stake",
            args: [amount.toString()],
          },
        ],
      });

      console.log("Stake finalPayload:", stakeResult.finalPayload);
      if (stakeResult.finalPayload.status === "error") {
        throw new Error(stakeResult.finalPayload.error_code || "Stake transaction failed");
      }

      await fetchStakingData();
      return stakeResult.finalPayload.transaction_id;
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
          if ((MiniKit as any).walletAddress) {
            setData((prev) => ({
              ...prev,
              isConnected: true,
              address: (MiniKit as any).walletAddress,
            }));
            return;
          }
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
