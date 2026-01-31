// lib/contracts/addresses.ts
// Direcciones de contratos tomadas desde .env.local
// SOLO para uso en frontend (NEXT_PUBLIC_)

export const STAKING_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`

export const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as `0x${string}`

// Opcional: chain id (World Chain Mainnet = 480)
export const WORLD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_WORLD_CHAIN_ID
)

// Validación simple en dev (opcional pero útil)
if (process.env.NODE_ENV === "development") {
  if (!STAKING_ADDRESS) {
    throw new Error("❌ STAKING_ADDRESS no está definido en .env.local")
  }
  if (!TOKEN_ADDRESS) {
    throw new Error("❌ TOKEN_ADDRESS no está definido en .env.local")
  }
}