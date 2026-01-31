"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useStaking } from "@/hooks/use-staking"
import { MiniKit } from "@worldcoin/minikit-js"
import { ethers } from "ethers"
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "@/lib/contracts/config"
import { minikitTransactions } from "@/lib/contracts/minikit-txs"
import ERC20_ABI from "@/lib/contracts/erc20-abi.json"
import STAKING_ABI from "@/lib/contracts/staking-abi.json"

interface StakeFormProps {
  availableBalance: number // Balance del token disponible (fuera del staking)
  onSuccess?: () => void   // Para refresh stats/history después
  loading?: boolean
}

export function StakeForm({
  availableBalance,
  onSuccess,
  loading = false,
}: StakeFormProps) {
  const [amount, setAmount] = useState("")
  const [txLoading, setTxLoading] = useState(false)
  const { toast } = useToast()
  const { address } = useStaking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!MiniKit.isInstalled()) {
      toast({
        title: "Error",
        description: "Abre esta mini app dentro de World App",
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    const stakeAmount = Number(amount)
    if (stakeAmount > availableBalance) {
      toast({
        title: "Balance insuficiente",
        description: `Solo tienes ${availableBalance.toFixed(6)} MTXs disponibles`,
        variant: "destructive",
      })
      return
    }

    setTxLoading(true)

    try {
      // Convertir monto a wei (18 decimals)
      const amountWei = ethers.parseUnits(amount, 18).toString()

      // World App 2026: Trigger approve floating message first
      toast({
        title: "Paso 1/2: Aprobación",
        description: "Autorizando el uso de tokens...",
      })

      const approveTx = minikitTransactions.approve(amountWei)
      const approveRes = await MiniKit.commandsAsync.sendTransaction({
        transaction: [approveTx]
      })

      if (approveRes.finalPayload.status !== "success") {
        throw new Error("La aprobación fue cancelada o falló")
      }

      // Trigger stake floating message second
      toast({
        title: "Paso 2/2: Confirmar Stake",
        description: "Ahora confirma el depósito final",
      })

      const stakeTx = minikitTransactions.stake(amountWei)
      const stakeRes = await MiniKit.commandsAsync.sendTransaction({
        transaction: [stakeTx]
      })

      if (stakeRes.finalPayload.status === "success") {
        toast({
          title: "¡ÉXITO TOTAL!",
          description: "Tus tokens ya están generando recompensas.",
        })
        setAmount("")
        onSuccess?.()
      } else {
        throw new Error("El depósito fue cancelado o falló")
      }
    } catch (err: any) {
      console.error("Stake error:", err)
      toast({
        title: "Error en stake",
        description: err.reason || err.message || "La transacción falló. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setTxLoading(false)
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (availableBalance * percentage) / 100
    setAmount(value.toFixed(6))
  }

  const isLoading = loading || txLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor="stake-amount"
          className="text-[10px] uppercase text-matrix-green/60 font-mono"
        >
          Amount to Stake
        </Label>

        <div className="relative">
          <Input
            id="stake-amount"
            type="number"
            step="0.000001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            className="text-sm font-mono bg-black/40 border-matrix-green/30 text-matrix-green h-9"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-matrix-green/40 font-mono">
            MTXs
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {[25, 50, 75, 100].map((pc) => (
          <Button
            key={pc}
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setPercentage(pc)}
            className="flex-1 h-7 text-[10px] border-matrix-green/20 text-matrix-green hover:bg-matrix-green/10"
          >
            {pc === 100 ? "MAX" : `${pc}%`}
          </Button>
        ))}
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={isLoading}
        className="w-full bg-matrix-green text-black hover:bg-matrix-green/90 font-mono h-9 shadow-[0_0_10px_rgba(0,255,0,0.3)]"
      >
        {isLoading ? "PROCESANDO..." : "CONFIRM STAKE"}
      </Button>
    </form>
  )
}