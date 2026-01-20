"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StakeStats } from "@/components/stake-stats"
import { StakeForm } from "@/components/stake-form"
import { UnstakeForm } from "@/components/unstake-form"
import { MatrixRain } from "@/components/matrix-rain"
import { WorldIdVerify } from "@/components/world-id-verify"
import { TransactionHistory } from "@/components/transaction-history"
import { ContractInfo } from "@/components/contract-info"
import { Wallet, Info, Activity, ShieldCheck } from "lucide-react"
import { useStaking } from "@/hooks/use-staking"
import { formatUnits, parseUnits } from "viem"

export default function MatrixStake() {
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake")
  const {
    stakedBalance,
    availableBalance,
    pendingRewards,
    unlockTime,
    apr,
    isUnlocked,
    isConnected,
    address,
    loading,
    connectWallet,
    stake,
    unstake,
    claim,
  } = useStaking()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const apyNumber = Number(apr)
  const stakedBalanceFormatted = Number(formatUnits(stakedBalance, 18))
  const availableBalanceFormatted = Number(formatUnits(availableBalance, 18))
  const pendingRewardsFormatted = Number(formatUnits(pendingRewards, 18))
  const estimatedDailyRewards = (stakedBalanceFormatted * apyNumber) / 100 / 365

  const handleStake = async (amount: number) => {
    try {
      const amountWei = parseUnits(amount.toString(), 18)
      await stake(amountWei)
    } catch (error: any) {
      console.error("Stake failed:", error)
      throw error
    }
  }

  const handleUnstake = async (amount: number) => {
    try {
      const amountWei = parseUnits(amount.toString(), 18)
      await unstake(amountWei)
    } catch (error: any) {
      console.error("Unstake failed:", error)
      throw error
    }
  }

  const handleClaim = async () => {
    try {
      await claim()
    } catch (error: any) {
      console.error("Claim failed:", error)
      throw error
    }
  }

  return (
    <main className="min-h-screen bg-black text-matrix-green font-mono selection:bg-matrix-green selection:text-black">
      <MatrixRain />

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4">
        {/* Header */}
        <header className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="relative group">
            <div className="absolute -inset-1 bg-matrix-green rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-3 bg-black rounded-full border border-matrix-green/50">
              <ShieldCheck className="w-8 h-8 text-matrix-green" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-matrix-green drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
            MATRIX STAKE
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-matrix-green/10 text-matrix-green border-matrix-green/50 animate-pulse">
                {"> CONNECTION_ESTABLISHED: "}
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connectWallet}
                className="h-7 text-[10px] border-matrix-green/50 text-matrix-green hover:bg-matrix-green/20"
              >
                {"> INITIALIZE_CONNECTION"}
              </Button>
            )}
          </div>
        </header>

        {/* Stats Grid */}
        <StakeStats
          stakedBalance={stakedBalanceFormatted}
          apy={apyNumber}
          estimatedRewards={estimatedDailyRewards}
        />

        {/* Main Interface */}
        <Card className="bg-black/60 border-matrix-green/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,0,0.1)] overflow-hidden">
          <div className="p-1 bg-black/80 border-b border-matrix-green/20 flex">
            <Button
              variant="ghost"
              className={`flex-1 rounded-sm ${activeTab === "stake" ? "bg-matrix-green/10 text-matrix-green" : "text-matrix-green/40"}`}
              onClick={() => setActiveTab("stake")}
            >
              STAKE
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-sm ${activeTab === "unstake" ? "bg-matrix-green/10 text-matrix-green" : "text-matrix-green/40"}`}
              onClick={() => setActiveTab("unstake")}
            >
              UNSTAKE
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-matrix-green/80 flex items-center gap-1">
                <Activity className="w-3 h-3" /> MANAGE_STAKE
              </span>
              <Badge variant="outline" className="text-[10px] border-matrix-green/20 text-matrix-green">
                APR {apyNumber}%
              </Badge>
            </div>

            {activeTab === "stake" ? (
              <StakeForm
                availableBalance={availableBalanceFormatted}
                onStake={handleStake}
                loading={loading}
              />
            ) : (
              <UnstakeForm
                stakedBalance={stakedBalanceFormatted}
                onUnstake={handleUnstake}
                loading={loading}
                isUnlocked={isUnlocked}
              />
            )}
          </div>
        </Card>

        {/* Rewards Section */}
        <Card className="bg-black/40 border-matrix-cyan/30 backdrop-blur-sm">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-matrix-cyan/60 uppercase">Pending_Rewards</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-matrix-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                  {pendingRewardsFormatted.toFixed(4)}
                </span>
                <span className="text-[10px] text-matrix-cyan/40">MTXs</span>
              </div>
            </div>
            <Button
              onClick={handleClaim}
              disabled={loading || pendingRewards === 0n || !isConnected}
              className="bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50 hover:bg-matrix-cyan/30 font-mono text-xs px-6"
            >
              {loading ? "..." : "CLAIM"}
            </Button>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <ContractInfo totalStaked={stakedBalance} contractBalance={availableBalance} />
        <TransactionHistory />

        <footer className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-4 text-[10px] text-matrix-green/40 font-mono">
            <span className="flex items-center gap-1"><Info className="w-3 h-3" /> v1.2.0-STABLE</span>
            <span>{"// NETWORK_WORLD_CHAIN"}</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
