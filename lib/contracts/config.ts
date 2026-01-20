export const STAKING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_CONTRACT || "0xd4292d1c53d6e025156c6ef0dd3d7645eb85dfe3") as `0x${string}`
export const TOKEN_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_CONTRACT || "0xd2f234926d10549a7232446cc1ff2e3a2fa57581") as `0x${string}`
export const WORLD_ID_ACTION = process.env.NEXT_PUBLIC_WORLD_ID_ACTION || process.env.NEXT_PUBLIC_WORLD_ID_ACCION || "stake-verification"
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ""
export const TOKEN_SYMBOL = "MTXs"
export const TOKEN_DECIMALS = 18
export const WORLD_CHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
