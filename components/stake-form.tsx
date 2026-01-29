"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMiniKit } from "@/components/ui/minikit-provider" // Ajusta ruta si es necesario
import { ethers } from "ethers" // Solo importamos ethers
import { STAKING_ADDRESS, TOKEN_ADDRESS } from "@/contracts/addresses" // Tus exports
// Importa tus ABIs como objetos JSON o strings (de contracts/)
import ERC20_ABI from "@/contracts/erc20-abi.json"
import STAKING_ABI from "@/contracts/staking-abi.json"

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
  const miniKit = useMiniKit()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!miniKit?.installed) {
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
      // Convertir monto a wei (18 decimals como en tu script original)
      const amountWei = ethers.utils.parseUnits(amount, 18)

      // 1. Approve calldata con ethers.Interface
      const tokenInterface = new ethers.utils.Interface(ERC20_ABI)
      const approveData = tokenInterface.encodeFunctionData("approve", [
        STAKING_ADDRESS,
        amountWei,
      ])

      const approveTx = {
        to: TOKEN_ADDRESS,
        data: approveData, // ya es '0x...' string
        value: "0x0",      // o 0n si prefieres BigInt, pero string funciona
      }

      // 2. Stake calldata
      const stakingInterface = new ethers.utils.Interface(STAKING_ABI)
      const stakeData = stakingInterface.encodeFunctionData("stake", [amountWei])

      const stakeTx = {
        to: STAKING_ADDRESS,
        data: stakeData,
        value: "0x0",
      }

      // Enviar batch: approve + stake (MiniKit lo maneja en una firma)
      const response = await miniKit.sendTransaction([approveTx, stakeTx])

      if (response.success && response.transactionHash) {
        toast({
          title: "¡Stake realizado!",
          description: `Tx: ${response.transactionHash.slice(0, 10)}...`,
        })
        setAmount("")
        onSuccess?.() // Refresh stats, etc.
      } else {
        throw new Error(response.error?.message || "Transacción rechazada")
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