// src/services/staking.service.ts

import { publicClient, walletClient } from "../world/wallet"
import { CONTRACTS } from "../config/contracts"
import STAKING from "../abi/MatrixStaking.json"

export async function stake(amount: bigint, address: `0x${string}`) {
  if (!walletClient) throw new Error("Wallet no conectada")

  return walletClient.writeContract({
    address: CONTRACTS.staking,
    abi: STAKING,
    functionName: "stake",
    args: [amount],
    account: address,
  })
}

export async function unstake(address: `0x${string}`) {
  if (!walletClient) throw new Error("Wallet no conectada")

  return walletClient.writeContract({
    address: CONTRACTS.staking,
    abi: STAKING,
    functionName: "unstake",
    args: [],
    account: address,
  })
}

export async function claim(address: `0x${string}`) {
  if (!walletClient) throw new Error("Wallet no conectada")

  return walletClient.writeContract({
    address: CONTRACTS.staking,
    abi: STAKING,
    functionName: "claim",
    args: [],
    account: address,
  })
}

export async function getUserStake(address: `0x${string}`) {
  return publicClient.readContract({
    address: CONTRACTS.staking,
    abi: STAKING,
    functionName: "stakes",
    args: [address],
  })
}