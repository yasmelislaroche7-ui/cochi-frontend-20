"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"

import stakingAbi from "@/lib/contracts/staking-abi.json"
import erc20Abi from "@/lib/contracts/erc20-abi.json"

import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from "@/lib/contracts/config"

export interface StakingData {
  stakedBalance: bigint
  availableBalance: bigint
  pendingRewards: bigint
  unlockTime: bigint
  apr: bigint
  isUnlocked: boolean
  isConnected: boolean
  address: string | null
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
  })

  const [loading, setLoading] = useState(false)

  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  })

  /* =======================
     WALLET CONNECTION
  ======================= */

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") return null

    // ya conectado
    if ((MiniKit as any).walletAddress) {
      const addr = (MiniKit as any).walletAddress
      setData((p) => ({ ...p, isConnected: true, address: addr }))
      return addr
    }

    const res = await MiniKit.commandsAsync.walletAuth({
      nonce: crypto.randomUUID(),
      requestId: "matrix-stake",
      expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(),
      statement: "Connect to Matrix Stake",
    })

    if (res.finalPayload.status === "error") {
      throw new Error(res.finalPayload.error_code)
    }

    const address =
      (res.finalPayload as any).address ||
      (MiniKit as any).walletAddress

    if (!address) throw new Error("No wallet address")

    setData((p) => ({
      ...p,
      isConnected: true,
      address,
    }))

    return address
  }, [])

  /* =======================
     READ STAKING DATA
  ======================= */

  const fetchStakingData = useCallback(async () => {
    if (!data.address) return

    try {
      const [userInfo, apr, balance] = await Promise.all([
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
      ])

      const [staked, pending, , unlockTime] = userInfo
      const now = BigInt(Math.floor(Date.now() / 1000))

      setData((p) => ({
        ...p,
        stakedBalance: staked,
        pendingRewards: pending,
        unlockTime,
        availableBalance: balance,
        apr,
        isUnlocked: now >= unlockTime,
      }))
    } catch (e) {
      console.error("fetchStakingData error", e)
    }
  }, [data.address, publicClient])

  /* =======================
     APPROVE (STEP 1)
  ======================= */

  const approve = async (amount: bigint) => {
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [STAKING_CONTRACT_ADDRESS, amount.toString()],
        },
      ],
    })

    if (finalPayload.status === "error") {
      throw new Error(finalPayload.error_code)
    }
  }

  /* =======================
     STAKE (STEP 2)
  ======================= */

  const stake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected")

    setLoading(true)
    try {
      // 1️⃣ approve
      await approve(amount)

      // 2️⃣ stake
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: stakingAbi,
            functionName: "stake",
            args: [amount.toString()],
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code)
      }

      await fetchStakingData()
      return finalPayload.transaction_id
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     UNSTAKE
  ======================= */

  const unstake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected")

    setLoading(true)
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: stakingAbi,
            functionName: "unstake",
            args: [amount.toString()],
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code)
      }

      await fetchStakingData()
      return finalPayload.transaction_id
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     CLAIM
  ======================= */

  const claim = async () => {
    if (!data.address) throw new Error("Wallet not connected")

    setLoading(true)
    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
            abi: stakingAbi,
            functionName: "claim",
            args: [],
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code)
      }

      await fetchStakingData()
      return finalPayload.transaction_id
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     EFFECTS
  ======================= */

  useEffect(() => {
    if (MiniKit.isInstalled() && !data.isConnected) {
      connectWallet().catch(console.error)
    }
  }, [connectWallet, data.isConnected])

  useEffect(() => {
    if (!data.isConnected) return
    fetchStakingData()
    const i = setInterval(fetchStakingData, 10_000)
    return () => clearInterval(i)
  }, [data.isConnected, fetchStakingData])

  return {
    ...data,
    loading,
    connectWallet,
    stake,
    unstake,
    claim,
    refreshData: fetchStakingData,
  }
}