import stakingAbi from "./staking-abi.json"
import erc20Abi from "./erc20-abi.json"

export const STAKING_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS ||
    "0xd4292d1c53d6e025156c6ef0dd3d7645eb85dfe3") as `0x${string}`

export const TOKEN_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ||
    "0xd2f234926d10549a7232446cc1ff2e3a2fa57581") as `0x${string}`

export const STAKING_ABI = stakingAbi
export const TOKEN_ABI = erc20Abi

export const TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_TOKEN_SYMBOL || "MTXs"

export const TOKEN_DECIMALS = Number(
  process.env.NEXT_PUBLIC_TOKEN_DECIMALS || 18
)

export const WORLD_CHAIN_RPC =
  process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC ||
  "https://worldchain-mainnet.g.alchemy.com/public"

export const WORLD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_WORLD_CHAIN_ID || 480
)
