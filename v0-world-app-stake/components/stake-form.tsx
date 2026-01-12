"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface StakeFormProps {
  availableBalance: number
  onStake: (amount: number) => Promise<void>
  loading?: boolean
}

export function StakeForm({ availableBalance, onStake, loading }: StakeFormProps) {
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

    if (numAmount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens",
        variant: "destructive",
      })
      return
    }

    try {
      await onStake(numAmount)
      setAmount("")
      toast({
        title: "Stake successful!",
        description: `You staked ${numAmount.toFixed(2)} WORLD`,
      })
    } catch (error: any) {
      toast({
        title: "Stake failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      })
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (availableBalance * percentage) / 100
    setAmount(value.toFixed(6))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stake-amount">Amount to Stake</Label>
        <Input
          id="stake-amount"
          type="number"
          step="0.000001"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-lg font-mono"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPercentage(25)}
          className="flex-1"
          disabled={loading}
        >
          25%
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPercentage(50)}
          className="flex-1"
          disabled={loading}
        >
          50%
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPercentage(75)}
          className="flex-1"
          disabled={loading}
        >
          75%
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPercentage(100)}
          className="flex-1"
          disabled={loading}
        >
          Max
        </Button>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Stake Tokens"}
      </Button>
    </form>
  )
}
