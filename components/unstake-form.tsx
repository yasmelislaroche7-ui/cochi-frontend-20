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
import { STAKING_CONTRACT_ADDRESS } from "@/lib/contracts/config"
import STAKING_ABI from "@/lib/contracts/staking-abi.json"

interface UnstakeFormProps {
  availableToUnstake: number  // Balance staked / disponible para retirar
  onSuccess?: () => void      // Para refrescar stats después del unstake
  loading?: boolean
}

export function UnstakeForm({
  availableToUnstake,
  onSuccess,
  loading = false,
}: UnstakeFormProps) {
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

    const unstakeAmount = Number(amount)
    if (unstakeAmount > availableToUnstake) {
      toast({
        title: "Saldo insuficiente",
        description: `Solo tienes ${availableToUnstake.toFixed(6)} MTXs disponibles para retirar`,
        variant: "destructive",
      })
      return
    }

    setTxLoading(true)

    try {
      // Convertir a wei (18 decimals)
      const amountWei = ethers.parseUnits(amount, 18).toString()

      const unstakeTx = {
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: "unstake",
        args: [amountWei],
      }

      // World App 2026 Standard for Unstake
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [unstakeTx]
      })

      if (finalPayload.status === "success") {
        toast({
          title: "¡Retiro Exitoso!",
          description: "Tus tokens han sido retirados correctamente.",
        })
        setAmount("")
        onSuccess?.()
      } else {
        throw new Error(finalPayload.error_code || "La transacción fue cancelada")
      }
    } catch (err: any) {
      console.error("Unstake error:", err)
      toast({
        title: "Error al retirar",
        description: err.reason || err.message || "La transacción falló. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setTxLoading(false)
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (availableToUnstake * percentage) / 100
    setAmount(value.toFixed(6))
  }

  const isLoading = loading || txLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor="unstake-amount"
          className="text-[10px] uppercase text-matrix-green/60 font-mono"
        >
          Amount to Unstake
        </Label>

        <div className="relative">
          <Input
            id="unstake-amount"
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
        disabled={isLoading || availableToUnstake <= 0}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-mono h-9 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
      >
        {isLoading ? "PROCESANDO..." : "CONFIRM UNSTAKE"}
      </Button>
    </form>
  )
}