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
import { Coins, TrendingUp, Clock, Wallet, AlertTriangle } from "lucide-react"
import { useStaking } from "@/hooks/use-staking"
import { formatUnits, parseUnits } from "viem"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function StakingApp() {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        handleConnect()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const apyNumber = Number(apr) / 100
  const stakedBalanceFormatted = Number(formatUnits(stakedBalance, 18))
  const availableBalanceFormatted = Number(formatUnits(availableBalance, 18))
  const pendingRewardsFormatted = Number(formatUnits(pendingRewards, 18))
  const estimatedDailyRewards = (stakedBalanceFormatted * apyNumber) / 100 / 365

  const unlockDate = unlockTime > 0n ? new Date(Number(unlockTime) * 1000) : null
  const isLocked = unlockDate && unlockDate > new Date()

  const handleConnect = async () => {
    try {
      const addr = await connectWallet()
      if (!addr) {
        console.warn("Could not connect wallet via MiniKit")
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
    }
  }

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
    <>
      <MatrixRain />

      <div className="min-h-screen relative z-10 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2 py-4">
            <h1 className="text-4xl md:text-5xl font-bold text-matrix-green font-mono tracking-wider drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
              MATRIX STAKE
            </h1>
            <p className="text-matrix-green/70 font-mono text-sm">
              {">"} STAKING_INTERFACE_ACTIVE_
            </p>
          </div>

          <StakeStats
            stakedBalance={stakedBalanceFormatted}
            apy={apyNumber}
            estimatedRewards={estimatedDailyRewards}
          />

          <WorldIdVerify autoVerify={isConnected} />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Staking Card */}
              <Card className="border-matrix-green/30 bg-black/50 backdrop-blur shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-matrix-green font-mono">MANAGE_STAKE.exe</CardTitle>
                      <CardDescription className="mt-2 text-matrix-green/60 font-mono text-xs">
                        {">"} Stake or unstake your tokens_
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-sm font-mono bg-matrix-green/20 text-matrix-green border-matrix-green/50"
                    >
                      APY {apyNumber}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tab Buttons */}
                  <div className="flex gap-2 p-1 bg-black/30 rounded-lg border border-matrix-green/20">
                    <Button
                      variant={activeTab === "stake" ? "default" : "ghost"}
                      className={
                        activeTab === "stake"
                          ? "flex-1 bg-matrix-green/20 text-matrix-green border border-matrix-green/50 hover:bg-matrix-green/30 font-mono"
                          : "flex-1 text-matrix-green/60 hover:text-matrix-green hover:bg-matrix-green/10 font-mono"
                      }
                      onClick={() => setActiveTab("stake")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      STAKE
                    </Button>
                    <Button
                      variant={activeTab === "unstake" ? "default" : "ghost"}
                      className={
                        activeTab === "unstake"
                          ? "flex-1 bg-matrix-green/20 text-matrix-green border border-matrix-green/50 hover:bg-matrix-green/30 font-mono"
                          : "flex-1 text-matrix-green/60 hover:text-matrix-green hover:bg-matrix-green/10 font-mono"
                      }
                      onClick={() => setActiveTab("unstake")}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      UNSTAKE
                    </Button>
                  </div>

                  {/* Balance Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-lg border border-matrix-green/20">
                      <p className="text-xs text-matrix-green/60 mb-1 font-mono">AVAILABLE</p>
                      <p className="text-2xl font-bold font-mono text-matrix-green">
                        {availableBalanceFormatted.toFixed(2)}
                      </p>
                      <p className="text-xs text-matrix-green/40 mt-1 font-mono">WORLD</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-matrix-cyan/20">
                      <p className="text-xs text-matrix-cyan/60 mb-1 font-mono">STAKED</p>
                      <p className="text-2xl font-bold font-mono text-matrix-cyan">
                        {stakedBalanceFormatted.toFixed(2)}
                      </p>
                      <p className="text-xs text-matrix-cyan/40 mt-1 font-mono">WORLD</p>
                    </div>
                  </div>

                  {/* Forms */}
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
                </CardContent>
              </Card>

              {/* Rewards Card */}
              <Card className="border-matrix-cyan/30 bg-black/50 backdrop-blur shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-matrix-cyan/60 font-mono">PENDING_REWARDS</p>
                      <p className="text-3xl font-bold font-mono text-matrix-cyan">
                        {pendingRewardsFormatted.toFixed(6)} WORLD
                      </p>
                      {isLocked && unlockDate && (
                        <div className="flex items-center gap-2 text-xs text-matrix-orange mt-2 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            UNLOCK: {unlockDate.toLocaleDateString()} {unlockDate.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleClaim}
                      disabled={loading || !!isLocked || !isConnected}
                      size="lg"
                      className="bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50 hover:bg-matrix-cyan/30 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] disabled:opacity-50 font-mono"
                    >
                      {loading ? "PROCESSING..." : isLocked ? "LOCKED" : "CLAIM"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <ContractInfo totalStaked={stakedBalance} contractBalance={availableBalance} />
              <TransactionHistory />
            </div>
          </div>

          <div className="text-center text-matrix-green/40 text-xs space-y-2 pb-8 font-mono">
            <p>{">"} UNSTAKING_LOCK_PERIOD = 1_DAY</p>
            <p>{">"} REWARDS_AUTO_CALCULATED = TRUE</p>
            <p className="text-matrix-green/60">{">"} MATRIX_STAKE_v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  )
}
