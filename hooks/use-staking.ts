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
import { minikitTransactions } from "@/lib/contracts/minikit-txs"

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

    try {
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
        }).catch(err => { console.error("Error reading stakedAmount:", err); return 0n; }),
        publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS,
          abi: stakingAbi,
          functionName: "pendingRewards",
          args: [address],
        }).catch(err => { console.error("Error reading pendingRewards:", err); return 0n; }),
        publicClient.readContract({
          address: TOKEN_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }).catch(err => { console.error("Error reading balanceOf:", err); return 0n; }),
        publicClient.readContract({
          address: STAKING_CONTRACT_ADDRESS,
          abi: stakingAbi,
          functionName: "apr",
        }).catch(err => { console.error("Error reading apr:", err); return 0n; }),
      ])

      setStakedBalance(staked as bigint)
      setPendingRewards(rewards as bigint)
      setAvailableBalance(balance as bigint)
      setApr(Number(aprValue))
      console.log("SYNC_DATA:", { address, balance: formatUnits(balance as bigint, 18), staked: formatUnits(staked as bigint, 18), apr: aprValue })
    } catch (error) {
      console.error("Error in refreshData:", error)
    }
  }, [address, publicClient])

  // Connection management
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !MiniKit.isInstalled()) return null

    try {
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: "0",
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(),
        statement: "Connect to Matrix Stake",
      } as any) as any

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Wallet connection failed")
      }

      const addr = finalPayload.address || (MiniKit as any).walletAddress
      if (!addr) throw new Error("Wallet address not found")

      setAddress(addr)
      return addr
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }, [])

  // Auto-connect and polling
  useEffect(() => {
    if (typeof window !== "undefined" && MiniKit.isInstalled()) {
      const addr = (MiniKit as any).walletAddress
      if (addr) setAddress(addr)
      else connectWallet() // Try to trigger auth if not automatically present
    }
  }, [connectWallet])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (address) {
      refreshData()
      interval = setInterval(refreshData, 10000)
    }
    return () => clearInterval(interval)
  }, [address, refreshData])

  const stake = async (amountStr: string) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const amount = parseUnits(amountStr, 18)
      if (amount <= 0n) throw new Error("El monto debe ser mayor que 0")

      const approveTx = minikitTransactions.approve(amount.toString())
      const stakeTx = minikitTransactions.stake(amount.toString())

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [approveTx, stakeTx]
      })

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
      const unstakeTx = minikitTransactions.unstake(amount.toString())

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [unstakeTx]
      })

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

  const claim = async (amount?: number) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const claimTx = minikitTransactions.claim()

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [claimTx]
      })

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