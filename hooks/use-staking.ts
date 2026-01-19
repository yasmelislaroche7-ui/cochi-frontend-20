"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { worldchain } from "viem/chains";
import { MiniKit } from "@worldcoin/minikit-js";
import stakingAbi from "@/lib/contracts/staking-abi.json";
import erc20Abi from "@/lib/contracts/erc20-abi.json";
import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
} from "@/lib/contracts/config";

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

      // Safe access to address for latest MiniKit types
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

  // Helper: Try to prompt World App signature/message with readable amounts; fallback to window.confirm
  const preSignPrompt = async (action: "approve" | "stake" | "claim", sendAmount?: bigint, receiveAmount?: bigint) => {
    try {
      const sendReadable = sendAmount !== undefined ? formatUnits(sendAmount, Number(TOKEN_DECIMALS)) : undefined;
      const receiveReadable = receiveAmount !== undefined ? formatUnits(receiveAmount, Number(TOKEN_DECIMALS)) : undefined;

      let message = "";
      if (action === "approve") {
        message = `Approve unlimited ${TOKEN_SYMBOL} for staking contract (${STAKING_CONTRACT_ADDRESS}). This is a one-time approval so you won't need to approve every stake.`;
        if (sendReadable) message += `\nAmount intended to stake now: ${sendReadable} ${TOKEN_SYMBOL}`;
      } else if (action === "stake") {
        message = `You are about to STAKE ${sendReadable} ${TOKEN_SYMBOL} to contract ${STAKING_CONTRACT_ADDRESS}.`;
      } else if (action === "claim") {
        message = `You are about to CLAIM your pending rewards.`;
        if (receiveReadable) message += `\nEstimated claim amount: ${receiveReadable} ${TOKEN_SYMBOL}`;
      }

      // Try World App MiniKit signature prompt if available to surface message in the World App signer UI
      const signerApi = (MiniKit as any).commandsAsync;
      if (signerApi && typeof signerApi.signMessage === "function") {
        try {
          console.log("Attempting to use MiniKit signMessage for pre-sign prompt");
          const res = await signerApi.signMessage({ message });
          if (res?.finalPayload?.status === "error") {
            console.warn("signMessage returned error payload:", res.finalPayload);
            // fallback to confirm
            return window.confirm(message + "\n\nConfirm?");
          }
          // assume user approved
          return true;
        } catch (e) {
          console.warn("MiniKit signMessage failed or not supported:", e);
          // fallback to confirm
          return window.confirm(message + "\n\nConfirm?");
        }
      }

      // Fallback UI: native confirm
      return window.confirm(message + "\n\nConfirm?");
    } catch (e) {
      console.error("preSignPrompt error:", e);
      return window.confirm("Confirm transaction?");
    }
  };

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

      // Pre-sign/confirm approve+stake with message showing amounts (World App signer if available)
      const okApprovePrompt = await preSignPrompt("approve", amount);
      if (!okApprovePrompt) throw new Error("User cancelled approve confirmation");

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
        console.log("Allowance insufficient, sending infinite approve...");

        // Approve MAX_UINT256 so user doesn't need to approve each time
        const approveResult = await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [stakingAddress, MAX_UINT256.toString()],
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

      // Pre-sign/confirm stake action (showing amount)
      const okStakePrompt = await preSignPrompt("stake", amount);
      if (!okStakePrompt) throw new Error("User cancelled stake confirmation");

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
      // Optional: read pending rewards to include in pre-sign message
      let pending: bigint | undefined = undefined;
      try {
        pending = await publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: stakingAbi,
          functionName: "pendingRewards",
          args: [data.address as `0x${string}`],
        }) as Promise<bigint>;
      } catch (e) {
        console.warn("Could not read pending rewards for pre-sign:", e);
      }

      const okClaimPrompt = await preSignPrompt("claim", undefined, pending);
      if (!okClaimPrompt) throw new Error("User cancelled claim confirmation");

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