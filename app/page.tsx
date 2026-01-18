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

  const apyNumber = Number(apr)
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

      <div className="min-h-screen relative z-10 p-2 md:p-8">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="text-center py-2">
            <h1 className="text-2xl md:text-5xl font-bold text-matrix-green font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
              MATRIX STAKE
            </h1>
            {!isConnected ? (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleConnect}
                  size="sm"
                  className="mt-2 bg-matrix-green/20 text-matrix-green border border-matrix-green/50 hover:bg-matrix-green/30 font-mono animate-pulse"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  CONNECT_WORLD_APP.exe
                </Button>
                <p className="text-[10px] text-matrix-green/40 font-mono">
                  REQUIRED_FOR_STAKING_OPERATIONS
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-matrix-green/60 font-mono">
                {">"} CONNECTION_ESTABLISHED: {address?.slice(0, 6)}...{address?.slice(-4)}_
              </p>
            )}
          </div>

          <StakeStats
            stakedBalance={stakedBalanceFormatted}
            apy={apyNumber}
            estimatedRewards={estimatedDailyRewards}
          />

          <WorldIdVerify autoVerify={isConnected} />

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Main Staking Card */}
              <Card className="border-matrix-green/30 bg-black/50 backdrop-blur shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-matrix-green font-mono uppercase">Manage_Stake</CardTitle>
                    <Badge variant="outline" className="text-[9px] bg-matrix-green/20 text-matrix-green border-matrix-green/50">
                      APR {apyNumber}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-1 space-y-3">
                  {/* Tab Buttons */}
                  <div className="flex gap-2 p-1 bg-black/30 rounded-lg border border-matrix-green/20">
                    <Button
                      variant={activeTab === "stake" ? "default" : "ghost"}
                      size="sm"
                      className={activeTab === "stake" ? "flex-1 bg-matrix-green/20 text-matrix-green" : "flex-1 text-matrix-green/60"}
                      onClick={() => setActiveTab("stake")}
                    >
                      STAKE
                    </Button>
                    <Button
                      variant={activeTab === "unstake" ? "default" : "ghost"}
                      size="sm"
                      className={activeTab === "unstake" ? "flex-1 bg-matrix-green/20 text-matrix-green" : "flex-1 text-matrix-green/60"}
                      onClick={() => setActiveTab("unstake")}
                    >
                      UNSTAKE
                    </Button>
                  </div>

                  {/* Forms */}
                  {activeTab === "stake" ? (
                    <StakeForm availableBalance={availableBalanceFormatted} onStake={handleStake} loading={loading} />
                  ) : (
                    <UnstakeForm stakedBalance={stakedBalanceFormatted} onUnstake={handleUnstake} loading={loading} isUnlocked={isUnlocked} />
                  )}
                </CardContent>
              </Card>

              {/* Compact Rewards Card */}
              <Card className="border-matrix-cyan/30 bg-black/50 backdrop-blur p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-matrix-cyan/60 font-mono">PENDING_REWARDS</p>
                    <p className="text-xl font-bold font-mono text-matrix-cyan truncate">
                      {pendingRewardsFormatted.toFixed(4)} <span className="text-[10px]">MTXs</span>
                    </p>
                  </div>
                  <Button
                    onClick={handleClaim}
                    disabled={loading || !!isLocked || !isConnected}
                    size="sm"
                    className="bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50 px-6 font-mono"
                  >
                    CLAIM
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
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
