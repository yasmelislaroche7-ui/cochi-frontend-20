"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"
import stakingAbi from "@/lib/contracts/staking-abi.json"
import erc20Abi from "@/lib/contracts/erc20-abi.json"
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "@/lib/contracts/config"

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
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
  })

  const connectWallet = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      throw new Error("Please open this app in World App")
    }

    try {
      const address = MiniKit.walletAddress

      if (!address) {
        throw new Error("No wallet address available")
      }

      setData((prev) => ({
        ...prev,
        isConnected: true,
        address: address,
      }))

      return address
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }, [])

  // Fetch user staking data
  const fetchStakingData = useCallback(async () => {
    if (!data.address) return

    try {
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
      ])

      const [staked, pending, unlockTime] = userInfo
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      const isUnlocked = currentTime >= unlockTime

      setData((prev) => ({
        ...prev,
        stakedBalance: staked,
        pendingRewards: pending,
        unlockTime: unlockTime,
        availableBalance: tokenBalance,
        apr: apr || 1500n, // Fallback APR if contract returns 0
        isUnlocked,
      }))
    } catch (error: any) {
      console.error("Error fetching staking data:", error)
    }
  }, [data.address, publicClient])

  const stake = async (amount: bigint) => {
    if (!data.address) throw new Error("Wallet not connected")

    setLoading(true)
    try {
      // Check allowance
      const allowance = (await publicClient.readContract({
        address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [data.address as `0x${string}`, STAKING_CONTRACT_ADDRESS as `0x${string}`],
      })) as bigint

      const transactions = []

      // Approve if needed
      if (allowance < amount) {
        transactions.push({
          address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [STAKING_CONTRACT_ADDRESS, amount],
        })
      }

      // Stake
      transactions.push({
        address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount],
      })

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      })

      if (finalPayload.status === "error") {
        throw new Error("Transaction failed")
      }

      // Refresh data after successful transaction
      setTimeout(() => fetchStakingData(), 3000)

      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error staking:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

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
            args: [amount],
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error("Transaction failed")
      }

      // Refresh data after successful transaction
      setTimeout(() => fetchStakingData(), 3000)

      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error unstaking:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

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
        throw new Error("Transaction failed")
      }

      // Refresh data after successful transaction
      setTimeout(() => fetchStakingData(), 3000)

      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (data.isConnected) {
      fetchStakingData()
      const interval = setInterval(fetchStakingData, 10000)
      return () => clearInterval(interval)
    }
  }, [data.isConnected, fetchStakingData])

  useEffect(() => {
    if (MiniKit.isInstalled() && MiniKit.walletAddress && !data.isConnected) {
      connectWallet()
    }
  }, [connectWallet, data.isConnected])

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
