// contracts/addresses.ts
// Archivo centralizado para todas las direcciones de contratos

// Recomendación: Usa .env.local para valores sensibles o variables
// Pero por simplicidad y compatibilidad con tu setup actual, las ponemos aquí hardcoded

// Puedes cambiarlas fácilmente o importar desde .env si prefieres
export const ADDRESSES = {
  // World Chain Mainnet (o la chain que uses)
  mainnet: {
    STAKING: "0xd4292d1c53d6e025156c6ef0dd3d7645eb85dfe3" as `0x${string}`,
    TOKEN: "0xd2f234926d10549a7232446cc1ff2e3a2fa57581" as `0x${string}`,
  },

  // World Chain Testnet (agrega si usas testnet)
  testnet: {
    STAKING: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Cambia por tu testnet
    TOKEN: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },

  // Puedes agregar más chains en el futuro (ej: Optimism, Sepolia, etc.)
}

// Exporta las direcciones actuales (elige la chain que uses)
export const STAKING_ADDRESS = ADDRESSES.mainnet.STAKING
export const TOKEN_ADDRESS = ADDRESSES.mainnet.TOKEN

// Helper para obtener dirección según chain (opcional, pero útil)
export function getAddresses(chainId: number | string): {
  STAKING: `0x${string}`
  TOKEN: `0x${string}`
} {
  // Ejemplo: 480 = World Chain Mainnet (confirma el chain ID real)
  if (chainId === 480 || chainId === "480") {
    return ADDRESSES.mainnet
  }
  // Agrega más condiciones según necesites
  return ADDRESSES.mainnet // fallback
}

// Tipo para TypeScript estricto (opcional pero recomendado)
export type ContractAddresses = {
  STAKING: `0x${string}`
  TOKEN: `0x${string}`
}