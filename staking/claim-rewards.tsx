"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMiniKit } from "@/components/ui/minikit-provider"
import { ethers } from "ethers"
import { STAKING_ADDRESS } from "@/contracts/addresses"
import STAKING_ABI from "@/contracts/staking-abi.json"

export function ClaimRewards() {
  const [pendingRewards, setPendingRewards] = useState("0.00")
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const { toast } = useToast()
  const miniKit = useMiniKit()

  // Función para consultar las recompensas pendientes (read-only)
  const fetchPendingRewards = async () => {
    if (!miniKit?.walletAddress || !miniKit.installed) return

    setLoading(true)

    try {
      // Creamos un provider público (puedes usar el RPC de World Chain)
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || "https://worldchain-mainnet.rpc.worldcoin.org"
      )

      const staking = new ethers.Contract(
        STAKING_ADDRESS,
        STAKING_ABI,
        provider
      )

      const pending = await staking.pendingRewards(miniKit.walletAddress)
      const formatted = ethers.utils.formatUnits(pending, 18)

      setPendingRewards(Number(formatted).toFixed(6))
    } catch (err) {
      console.error("Error al consultar pendingRewards:", err)
      toast({
        title: "Error al cargar recompensas",
        description: "No pudimos obtener las recompensas pendientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar al montar y cuando cambie la wallet
  useEffect(() => {
    if (miniKit?.walletAddress) {
      fetchPendingRewards()
      // Opcional: refresh cada 30 segundos
      const interval = setInterval(fetchPendingRewards, 30000)
      return () => clearInterval(interval)
    }
  }, [miniKit?.walletAddress])

  const handleClaim = async () => {
    if (!miniKit?.installed) {
      toast({
        title: "Error",
        description: "Abre esta mini app dentro de World App",
        variant: "destructive",
      })
      return
    }

    if (Number(pendingRewards) <= 0) {
      toast({
        title: "Sin recompensas",
        description: "No tienes recompensas pendientes para reclamar",
        variant: "destructive",
      })
      return
    }

    setTxLoading(true)

    try {
      const stakingInterface = new ethers.utils.Interface(STAKING_ABI)
      const claimData = stakingInterface.encodeFunctionData("claim", [])

      const claimTx = {
        to: STAKING_ADDRESS,
        data: claimData,
        value: "0x0",
      }

      const response = await miniKit.sendTransaction([claimTx])

      if (response.success && response.transactionHash) {
        toast({
          title: "¡Recompensas reclamadas!",
          description: `Tx: ${response.transactionHash.slice(0, 10)}...`,
        })
        // Refrescar inmediatamente después del claim
        fetchPendingRewards()
      } else {
        throw new Error(response.error?.message || "Transacción rechazada")
      }
    } catch (err: any) {
      console.error("Claim error:", err)
      toast({
        title: "Error al reclamar",
        description: err.reason || err.message || "La transacción falló",
        variant: "destructive",
      })
    } finally {
      setTxLoading(false)
    }
  }

  const isLoading = loading || txLoading

  return (
    <div className="space-y-4 p-4 border border-matrix-green/30 rounded-lg bg-black/40">
      <div className="text-center">
        <h3 className="text-lg font-mono uppercase text-matrix-green mb-2">
          Recompensas Pendientes
        </h3>
        <p className="text-2xl font-bold text-green-400 font-mono">
          {isLoading ? "Cargando..." : `${pendingRewards} MTXs`}
        </p>
      </div>

      <Button
        onClick={handleClaim}
        disabled={isLoading || Number(pendingRewards) <= 0}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-mono h-10 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
      >
        {txLoading
          ? "PROCESANDO..."
          : isLoading
          ? "CARGANDO..."
          : "CLAIM REWARDS"}
      </Button>

      {Number(pendingRewards) > 0 && (
        <p className="text-xs text-matrix-green/60 text-center font-mono">
          Reclama tus recompensas acumuladas sin costo adicional (gasless en World Chain)
        </p>
      )}
    </div>
  )
}