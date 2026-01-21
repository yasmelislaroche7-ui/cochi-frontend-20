"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UnstakeFormProps {
  stakedBalance: number
  onUnstake: (amount: number) => Promise<void>
  loading?: boolean
  isUnlocked?: boolean
}

export function UnstakeForm({ stakedBalance, onUnstake, loading, isUnlocked }: UnstakeFormProps) {
  const [amount, setAmount] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number.parseFloat(amount)

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (numAmount > stakedBalance) {
      toast({
        title: "Insufficient staked balance",
        description: "You don't have enough staked tokens",
        variant: "destructive",
      })
      return
    }

    try {
      await onUnstake(numAmount)
      setAmount("")
    } catch (error: any) {
      // Error handled in parent handleUnstake
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (stakedBalance * percentage) / 100
    setAmount(value.toFixed(6))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Alert className="py-2 border-matrix-orange/30 bg-matrix-orange/5">
        <AlertDescription className="text-[10px] text-matrix-orange font-mono leading-tight">
          {isUnlocked
            ? "> UNLOCK_CONFIRMED: READY_TO_WITHDRAW"
            : "> LOCK_ACTIVE: 1_DAY_DELAY_REQUIRED"}
        </AlertDescription>
      </Alert>

      <div className="space-y-1">
        <Label htmlFor="unstake-amount" className="text-[10px] uppercase text-matrix-cyan/60 font-mono">Amount to Unstake</Label>
        <div className="relative">
          <Input
            id="unstake-amount"
            type="number"
            step="0.000001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm font-mono bg-black/40 border-matrix-cyan/30 text-matrix-cyan h-9"
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-matrix-cyan/40 font-mono">
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
            onClick={() => setPercentage(pc)}
            className="flex-1 h-7 text-[10px] border-matrix-cyan/20 text-matrix-cyan hover:bg-matrix-cyan/10"
            disabled={loading}
          >
            {pc === 100 ? "MAX" : `${pc}%`}
          </Button>
        ))}
      </div>

      <Button type="submit" size="sm" variant="secondary" className="w-full bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50 hover:bg-matrix-cyan/30 font-mono h-9" disabled={loading}>
        {loading ? "PROCESSING..." : "CONFIRM_UNSTAKE"}
      </Button>
    </form>
  )
}
