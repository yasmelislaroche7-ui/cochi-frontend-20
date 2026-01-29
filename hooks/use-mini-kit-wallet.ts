// hooks/use-mini-kit-wallet.ts
'use client'

import { useState, useEffect } from 'react'
import { useMiniKit } from '@/components/ui/minikit-init' // Ajusta la ruta a tu MiniKitProvider o init

export function useMiniKitWallet() {
  const miniKit = useMiniKit()
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!miniKit) {
      setError('MiniKit no inicializado. Abre la app en World App.')
      setLoading(false)
      return
    }

    if (miniKit.installed) {
      MiniKit.install() // Asegura inicialización
      const walletAddr = miniKit.walletAddress
      if (walletAddr) {
        setAddress(walletAddr)
        setIsConnected(true)
      } else {
        setError('Wallet no detectada. Asegúrate de tener una wallet en World App.')
      }
    } else {
      setError('MiniKit no instalado. Debes abrir esta mini app dentro de World App.')
    }
    setLoading(false)
  }, [miniKit])

  // Función para "conectar" (en realidad solo verifica, no hace connect como wagmi)
  const connectWallet = () => {
    if (miniKit?.installed) {
      MiniKit.install()
      const addr = miniKit.walletAddress
      if (addr) {
        setAddress(addr)
        setIsConnected(true)
        setError(null)
      }
    } else {
      setError('Abre la app en World App para conectar')
    }
  }

  return {
    isConnected,
    address,
    loading,
    error,
    connectWallet,
    miniKit, // Para usar sendTransaction directamente
  }
}