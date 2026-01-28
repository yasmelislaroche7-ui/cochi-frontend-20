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
} from "@/lib/contracts/addresses"

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

  const connectWallet = async () => {
    const res = await MiniKit.walletAuth()
    setAddress(res.address)
  }

  const stake = async (amountStr: string) => {
    setLoading(true)
    try {
      const tx = await MiniKit.sendTransaction({
        to: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "stake",
        args: [parseUnits(amountStr, 18)],
      })
      await refreshData()
      return tx.transactionId
    } finally {
      setLoading(false)
    }
  }

  const unstake = async (amountStr: string) => {
    setLoading(true)
    try {
      const tx = await MiniKit.sendTransaction({
        to: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "unstake",
        args: [parseUnits(amountStr, 18)],
      })
      await refreshData()
      return tx.transactionId
    } finally {
      setLoading(false)
    }
  }

  const claim = async () => {
    setLoading(true)
    try {
      const tx = await MiniKit.sendTransaction({
        to: STAKING_CONTRACT_ADDRESS,
        abi: stakingAbi,
        functionName: "claim",
      })
      await refreshData()
      return tx.transactionId
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