"use client"

import { useEffect, useState, useCallback } from "react"
import { createPublicClient, createWalletClient, http, formatUnits, parseUnits } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"
import stakingAbi from "@/lib/contracts/staking-abi.json"
import erc20Abi from "@/lib/contracts/erc20-abi.json"
import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from "@/lib/contracts/config"

export function useStaking() {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [stakedBalance, setStakedBalance] = useState<bigint>(0n)
  const [availableBalance, setAvailableBalance] = useState<bigint>(0n)
  const [pendingRewards, setPendingRewards] = useState<bigint>(0n)
  const [apr, setApr] = useState<number>(0)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true)

  const isConnected = !!address

  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(),
  })

  const refreshData = useCallback(async () => {
    if (!address) return

    const [
      staked,
      rewards,
      balance,
      aprValue,
    ] = await Promise.all([
      publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "stakedAmount",
        args: [address],
      }),
      publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "pendingRewards",
        args: [address],
      }),
      publicClient.readContract({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),
      publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "apr",
      }),
    ])

    setStakedBalance(staked as bigint)
    setPendingRewards(rewards as bigint)
    setAvailableBalance(balance as bigint)
    setApr(Number(aprValue))
  }, [address, publicClient])

  useEffect(() => {
    refreshData()
  }, [refreshData])

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

      setAddress(address)
      await refreshData()
      return address
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }, [refreshData])

  const stake = async (amountStr: string) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const amount = parseUnits(amountStr, 18)
      if (amount <= 0n) throw new Error("El monto debe ser mayor que 0")

      const txPayload = {
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS,
            abi: stakingAbi,
            functionName: "stake",
            args: [amount.toString()],
          },
        ],
      }

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(txPayload)

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transacción fallida")
      }

      setTimeout(refreshData, 8000)
      await refreshData()
      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en stake:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const unstake = async (amountStr: string) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const amount = parseUnits(amountStr, 18)
      const txPayload = {
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS,
            abi: stakingAbi,
            functionName: "unstake",
            args: [amount.toString()],
          },
        ],
      }

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(txPayload)

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transacción fallida")
      }

      setTimeout(refreshData, 8000)
      await refreshData()
      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en unstake:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const claim = async () => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const txPayload = {
        transaction: [
          {
            address: STAKING_CONTRACT_ADDRESS,
            abi: stakingAbi,
            functionName: "claim",
            args: [],
          },
        ],
      }

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(txPayload)

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Transacción fallida")
      }

      setTimeout(refreshData, 8000)
      await refreshData()
      return finalPayload.transaction_id
    } catch (error: any) {
      console.error("Error en claim:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    address,
    loading,
    isConnected,
    isUnlocked,
    stakedBalance,
    availableBalance,
    pendingRewards,
    apr,
    connectWallet,
    stake,
    unstake,
    claim,
  }
}