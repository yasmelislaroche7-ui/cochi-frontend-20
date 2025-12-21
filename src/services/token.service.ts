// src/services/token.service.ts

import { publicClient } from "../world/wallet"
import { CONTRACTS } from "../config/contracts"
import ERC20 from "../abi/ERC20.json"

export async function getTokenBalance(
  address: `0x${string}`
): Promise<bigint> {
  return publicClient.readContract({
    address: CONTRACTS.token,
    abi: ERC20,
    functionName: "balanceOf",
    args: [address],
  })
}