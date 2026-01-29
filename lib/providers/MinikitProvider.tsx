"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { MiniKit } from "@worldcoin/minikit-js"

interface MiniKitContextType {
  miniKit: typeof MiniKit | null
  isInstalled: boolean
  isConnected: boolean
  walletAddress: string | null
  loading: boolean
  error: string | null
}

const MiniKitContext = createContext<MiniKitContextType | undefined>(undefined)

export function MiniKitProvider({ children }: { children: ReactNode }) {
  const [miniKit, setMiniKit] = useState<typeof MiniKit | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const initialize = async () => {
      try {
        if (!MiniKit.isInstalled()) {
          setError("MiniKit no detectado. Abre esta mini app dentro de World App.")
          setLoading(false)
          return
        }

        setIsInstalled(true)

        const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID
        if (!appId) {
          setError("Falta NEXT_PUBLIC_WORLD_APP_ID en .env.local")
          setLoading(false)
          return
        }

        // Instalación con App ID
        await MiniKit.install({ appId })
        console.log("MiniKit instalado con App ID:", appId)

        const addr = MiniKit.walletAddress
        if (addr) {
          setWalletAddress(addr)
          setIsConnected(true)
        } else {
          // Polling ligero por si walletAddress tarda en aparecer
          const checkWallet = setInterval(() => {
            const currentAddr = MiniKit.walletAddress
            if (currentAddr) {
              setWalletAddress(currentAddr)
              setIsConnected(true)
              clearInterval(checkWallet)
              setLoading(false)
            }
          }, 500)

          // Limpieza después de 10 segundos máximo
          setTimeout(() => clearInterval(checkWallet), 10000)
        }

        // Señal ready para World App (evita loading infinito)
        if (window.parent !== window) {
          window.parent.postMessage({ type: "ready" }, "*")
        }

        setMiniKit(MiniKit)
      } catch (err: any) {
        console.error("Error inicializando MiniKit:", err)
        setError(err.message || "Fallo al inicializar MiniKit")
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  const value = {
    miniKit,
    isInstalled,
    isConnected,
    walletAddress,
    loading,
    error,
  }

  return <MiniKitContext.Provider value={value}>{children}</MiniKitContext.Provider>
}

// Hook para usar en cualquier componente
export function useMiniKitContext() {
  const context = useContext(MiniKitContext)
  if (!context) {
    throw new Error("useMiniKitContext debe usarse dentro de MiniKitProvider")
  }
  return context
}