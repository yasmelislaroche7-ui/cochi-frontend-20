"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, parseUnits } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"

import stakingAbi from "@/lib/contracts/staking-abi.json"
import erc20Abi from "@/lib/contracts/erc20-abi.json"

import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
} from "@/lib/contracts/config"

export function useStaking() {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  })

  // 🔗 CONNECT WALLET
  const connectWallet = useCallback(async () => {
    const res = await MiniKit.commandsAsync.walletAuth({
      nonce: crypto.randomUUID(),
      requestId: "0",
      expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(),
      statement: "Connect to staking app",
    })

    if (res.finalPayload.status === "error") {
      throw new Error("Wallet connection failed")
    }

    const addr = (res.finalPayload as any).address
    setAddress(addr)
    return addr
  }, [])

  // ✅ APPROVE (BOTÓN SEPARADO)
  const approve = async (amountStr: string) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const amount = parseUnits(amountStr, TOKEN_DECIMALS)

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: {
          to: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [STAKING_CONTRACT_ADDRESS, amount],
        },
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Approve failed")
      }

      return finalPayload.transaction_id
    } finally {
      setLoading(false)
    }
  }

  // ✅ STAKE (UNA SOLA FUNCIÓN, UNA SOLA TX)
  const stake = async (amountStr: string) => {
    if (!address) throw new Error("Wallet not connected")
    setLoading(true)

    try {
      const amount = parseUnits(amountStr, TOKEN_DECIMALS)

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: {
          to: STAKING_CONTRACT_ADDRESS as `0x${string}`,
          abi: stakingAbi,
          functionName: "stake",
          args: [amount],
        },
      })

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.error_code || "Stake failed")
      }

      return finalPayload.transaction_id
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const existing = (MiniKit as any).walletAddress
    if (existing) setAddress(existing)
  }, [])

  return {
    address,
    loading,
    connectWallet,
    approve,
    stake,
  }
}