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
      toast({
        title: "Unstake initiated",
        description: `${numAmount.toFixed(2)} WORLD will be available in 1 day`,
      })
    } catch (error: any) {
      toast({
        title: "Unstake failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      })
    }
  }

  const setPercentage = (percentage: number) => {
    const value = (stakedBalance * percentage) / 100
    setAmount(value.toFixed(6))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isUnlocked
            ? "You can unstake your tokens now"
            : "Unstaking requires a 1-day lock period before you can claim your tokens"}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="unstake-amount">Amount to Unstake</Label>
        <Input
          id="unstake-amount"
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

      <Button type="submit" size="lg" variant="secondary" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Unstake Tokens"}
      </Button>
    </form>
  )
}
