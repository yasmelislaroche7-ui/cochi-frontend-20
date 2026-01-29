"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton" // Si tienes skeleton en ui/
import { useMiniKit } from "@/components/ui/minikit-init" // o tu ruta de MiniKit
import { ethers } from "ethers"
import { STAKING_ADDRESS } from "@/contracts/addresses"
import STAKING_ABI from "@/contracts/staking-abi.json"
import { useToast } from "@/hooks/use-toast"

export function StakingStatsCard() {
  const miniKit = useMiniKit()
  const { toast } = useToast()

  const [stats, setStats] = useState({
    staked: "0.00",
    pendingRewards: "0.00",
    totalStaked: "0.00",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!miniKit?.walletAddress || !miniKit.installed) {
      setError("Abre la mini app en World App para ver stats")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC ||
          "https://worldchain-mainnet.rpc.worldcoin.org"
      )

      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider)

      const [rawStaked, rawPending, rawTotal] = await Promise.all([
        contract.balanceOf(miniKit.walletAddress),
        contract.pendingRewards(miniKit.walletAddress),
        contract.totalStaked ? contract.totalStaked() : contract.totalSupply(), // Ajusta según tu contrato
      ])

      setStats({
        staked: ethers.utils.formatUnits(rawStaked, 18),
        pendingRewards: ethers.utils.formatUnits(rawPending, 18),
        totalStaked: ethers.utils.formatUnits(rawTotal, 18),
      })
    } catch (err: any) {
      console.error("Error fetching staking stats:", err)
      setError("No pudimos cargar las estadísticas. Intenta de nuevo.")
      toast({
        title: "Error al cargar stats",
        description: "Verifica tu conexión o abre en World App",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (miniKit?.walletAddress) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000) // refresh cada 30s
      return () => clearInterval(interval)
    }
  }, [miniKit?.walletAddress])

  if (error) {
    return (
      <Card className="bg-black/40 border-red-500/30">
        <CardContent className="p-6 text-center text-red-400">
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/40 border-matrix-green/30 shadow-[0_0_20px_rgba(0,255,0,0.15)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-matrix-green font-mono uppercase text-lg tracking-wide">
          Tus Estadísticas de Staking
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-3 text-matrix-green">
        <div className="space-y-1">
          <p className="text-sm opacity-70 font-mono">Tu balance staked</p>
          {loading ? (
            <Skeleton className="h-8 w-32 bg-matrix-green/20" />
          ) : (
            <p className="text-2xl font-bold">{Number(stats.staked).toFixed(4)} MTXs</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm opacity-70 font-mono">Recompensas pendientes</p>
          {loading ? (
            <Skeleton className="h-8 w-32 bg-matrix-green/20" />
          ) : (
            <p className="text-2xl font-bold text-green-400">
              {Number(stats.pendingRewards).toFixed(4)} MTXs
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm opacity-70 font-mono">Total staked en pool</p>
          {loading ? (
            <Skeleton className="h-8 w-32 bg-matrix-green/20" />
          ) : (
            <p className="text-xl font-bold opacity-90">
              {Number(stats.totalStaked).toFixed(2)} MTXs
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}