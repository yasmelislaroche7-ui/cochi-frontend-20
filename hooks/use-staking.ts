"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, parseUnits, formatUnits, maxUint256 } from "viem"
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
    batch: { multicall: true },
  })

  const fetchStakingData = useCallback(async (userAddress: string) => {
    try {
      console.log("Fetching staking data for:", userAddress)

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
      ])

      const [staked, pending, unlockTime] = userInfo || [0n, 0n, 0n]
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      const isUnlocked = currentTime >= unlockTime

      setData((prev) => ({
        ...prev,
        stakedBalance: staked,
        pendingRewards: pending,
        unlockTime,
        availableBalance: tokenBalance,
        apr: apr || 500n,
        isUnlocked,
        isConnected: true,
        address: userAddress,
      }))
    } catch (error) {
      console.error("Error fetching staking data:", error)
    }
  }, [publicClient])

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") return null

    try {
      const res = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: "0",
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(),
        statement: "Connect to Matrix Stake",
      })

      if (res.finalPayload.status === "error") {
        throw new Error(res.finalPayload.error_code || "Wallet connection failed")
      }

      const payload = res.finalPayload as any
      const address = payload.address || (MiniKit as any).walletAddress

      if (!address) throw new Error("Wallet address not found")

      await fetchStakingData(address)
      return address
    } catch (error) {
      console.error("Error connecting wallet:", error)
      if ((MiniKit as any).walletAddress) {
        await fetchStakingData((MiniKit as any).walletAddress)
        return (MiniKit as any).walletAddress
      }
      throw error
    }
  }, [fetchStakingData])

  const stake = async (amountStr: string) => {
    if (!data.address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const tokenAddress = TOKEN_CONTRACT_ADDRESS as `0x${string}`
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`

      const amount = parseUnits(amountStr, TOKEN_DECIMALS)
      if (amount <= 0n) throw new Error("El monto debe ser mayor que 0")

      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [data.address as `0x${string}`, stakingAddress],
      }) as bigint

      const txs: any[] = []

      if (allowance < amount) {
        txs.push({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [stakingAddress, maxUint256],
        })
      }

      txs.push({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount],
      })

      console.log("Enviando transacciones para stake:", txs)

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: txs,
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || finalPayload.message || "Transacción fallida")
      }

      console.log("Stake enviado. Transaction ID:", finalPayload.transaction_id)

      // Refrescar datos después de un tiempo razonable
      setTimeout(() => {
        if (data.address) fetchStakingData(data.address)
      }, 8000)

      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en stake:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const unstake = async (amountStr: string) => {
    if (!data.address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`
      const amount = parseUnits(amountStr, TOKEN_DECIMALS)

      const txs = [
        {
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "unstake",
          args: [amount],
        },
      ]

      console.log("Enviando transacciones para unstake:", txs)

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: txs,
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transacción fallida")
      }

      setTimeout(() => data.address && fetchStakingData(data.address), 8000)
      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en unstake:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const claim = async () => {
    if (!data.address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const stakingAddress = STAKING_CONTRACT_ADDRESS as `0x${string}`

      const txs = [
        {
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "claim",
          args: [],
        },
      ]

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: txs,
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transacción fallida")
      }

      setTimeout(() => data.address && fetchStakingData(data.address), 8000)
      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en claim:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!MiniKit.isInstalled()) return
    const existing = (MiniKit as any).walletAddress
    if (existing && !data.isConnected) {
      fetchStakingData(existing)
    }
  }, [data.isConnected, fetchStakingData])

  return {
    ...data,
    loading,
    connectWallet,
    stake,
    unstake,
    claim,
    refreshData: () => data.address && fetchStakingData(data.address),
  }
}