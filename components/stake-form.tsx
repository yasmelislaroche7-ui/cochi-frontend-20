"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface StakeFormProps {
  availableBalance: number
  onStake: (amount: string) => Promise<void>
  loading?: boolean
}

export function StakeForm({
  availableBalance,
  onStake,
  loading = false,
}: StakeFormProps) {
  const [amount, setAmount] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto válido",
        variant: "destructive",
      })
      return
    }

    if (Number(amount) > availableBalance) {
      toast({
        title: "Balance insuficiente",
        description: "No tienes suficientes tokens",
        variant: "destructive",
      })
      return
    }

    try {
      await onStake(amount) // 👈 SOLO stake, sin approve
      setAmount("")
    } catch (err: any) {
      toast({
        title: "Error en stake",
        description: err?.message || "La transacción falló",
        variant: "destructive",
      })
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (availableBalance * percentage) / 100
    setAmount(value.toFixed(6))
  }

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
            disabled={loading}
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
            disabled={loading}
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
        disabled={loading}
        className="w-full bg-matrix-green text-black hover:bg-matrix-green/90 font-mono h-9 shadow-[0_0_10px_rgba(0,255,0,0.3)]"
      >
        {loading ? "FIRMANDO..." : "CONFIRM STAKE"}
      </Button>
    </form>
  )
}