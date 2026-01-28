"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMiniKit } from "@/components/ui/minikit-provider"
import { ethers } from "ethers"
import { TOKEN_ADDRESS, STAKING_ADDRESS } from "@/contracts/addresses"
import ERC20_ABI from "@/contracts/erc20-abi.json"

interface ApproveFormProps {
  availableBalance: number  // Balance disponible del token
  onSuccess?: () => void    // Para refrescar allowance después
  loading?: boolean
}

export function ApproveForm({
  availableBalance,
  onSuccess,
  loading = false,
}: ApproveFormProps) {
  const [amount, setAmount] = useState("")
  const [txLoading, setTxLoading] = useState(false)
  const { toast } = useToast()
  const miniKit = useMiniKit()

  const handleApprove = async (e: React.FormEvent) => {
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

    const approveAmount = Number(amount)
    if (approveAmount > availableBalance) {
      toast({
        title: "Balance insuficiente",
        description: `Solo tienes ${availableBalance.toFixed(6)} MTXs disponibles`,
        variant: "destructive",
      })
      return
    }

    setTxLoading(true)

    try {
      const amountWei = ethers.utils.parseUnits(amount, 18)

      const tokenInterface = new ethers.utils.Interface(ERC20_ABI)
      const approveData = tokenInterface.encodeFunctionData("approve", [
        STAKING_ADDRESS,
        amountWei,
      ])

      const approveTx = {
        to: TOKEN_ADDRESS,
        data: approveData,
        value: "0x0",
      }

      const response = await miniKit.sendTransaction([approveTx])

      if (response.success && response.transactionHash) {
        toast({
          title: "¡Aprobación realizada!",
          description: `Tx: ${response.transactionHash.slice(0, 10)}...`,
        })
        setAmount("")
        onSuccess?.() // Refresca allowance o stats
      } else {
        throw new Error(response.error?.message || "Transacción rechazada")
      }
    } catch (err: any) {
      console.error("Approve error:", err)
      toast({
        title: "Error en aprobación",
        description: err.reason || err.message || "La transacción falló",
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
    <form onSubmit={handleApprove} className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor="approve-amount"
          className="text-[10px] uppercase text-matrix-green/60 font-mono"
        >
          Amount to Approve
        </Label>

        <div className="relative">
          <Input
            id="approve-amount"
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
        className="w-full bg-yellow-600 text-black hover:bg-yellow-500 font-mono h-9 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
      >
        {isLoading ? "PROCESANDO..." : "APPROVE TOKEN"}
      </Button>
    </form>
  )
}