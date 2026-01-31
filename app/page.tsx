"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StakeStats } from "@/components/stake-stats"
import { StakeForm } from "@/components/stake-form"
import { UnstakeForm } from "@/components/unstake-form"
import { MatrixRain } from "@/components/matrix-rain"
import { TransactionHistory } from "@/components/transaction-history"
import { ContractInfo } from "@/components/contract-info"
import { Wallet, Info, Activity } from "lucide-react"
import { useStaking } from "@/hooks/use-staking"
import { formatUnits, parseUnits } from "viem"
import { useToast } from "@/hooks/use-toast"
import { MiniKit } from "@worldcoin/minikit-js"

import { STAKING_CONTRACT_ADDRESS } from "@/lib/contracts/config"
import STAKING_ABI from "@/lib/contracts/staking-abi.json"

export default function MatrixStake() {
  const { toast } = useToast()
  const {
    stakedBalance,
    availableBalance,
    pendingRewards,
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

  const handleConnect = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        toast({
          title: "MiniKit no instalado",
          description: "Por favor abre esta aplicación dentro de World App.",
          variant: "destructive"
        })
        return
      }

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        notBefore: new Date(),
        statement: "Conecta tu wallet para acceder a Matrix Stake",
      } as any) as any

      if (finalPayload.status === "success") {
        connectWallet()
        toast({
          title: "Bienvenido",
          description: "Wallet conectada exitosamente.",
        })
      }
    } catch (error) {
      console.error("Wallet connection error:", error)
    }
  }

  const apyNumber = Number(apr)
  const stakedBalanceFormatted = Number(formatUnits(stakedBalance, 18))
  const availableBalanceFormatted = Number(formatUnits(availableBalance, 18))
  const pendingRewardsFormatted = Number(formatUnits(pendingRewards, 18))
  const estimatedDailyRewards = (stakedBalanceFormatted * apyNumber) / 100 / 365

  const handleStake = async (amount: number) => {
    // La lógica se maneja directamente en StakeForm usando MiniKit.commandsAsync.sendTransaction
    connectWallet()
  }

  const handleUnstake = async (amount: number) => {
    // La lógica se maneja directamente en UnstakeForm usando MiniKit.commandsAsync.sendTransaction
    connectWallet()
  }

  const handleClaim = async (amount?: number) => {
    try {
      if (!MiniKit.isInstalled()) return
      
      const claimTx = {
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: "claimRewards",
        args: [],
      }

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [claimTx]
      })

      if (finalPayload.status === "success") {
        toast({
          title: "RECOMPENSAS_RECLAMADAS",
          description: "Tus recompensas han sido enviadas a tu wallet.",
        })
        connectWallet()
      }
    } catch (error: any) {
      console.error("Claim failed:", error)
    }
  }

  return (
    <main className="min-h-screen bg-black text-matrix-green font-mono selection:bg-matrix-green selection:text-black">
      <MatrixRain />

      <div className="relative z-10 max-w-md mx-auto p-4 pb-12 space-y-6">
        {/* Header */}
        <header className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-matrix-green rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-4 bg-black rounded-full border border-matrix-green/50">
              <Activity className="w-10 h-10 text-matrix-green" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-matrix-green drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]">
              MATRIX STAKE
            </h1>
            <p className="text-[10px] text-matrix-green/40 mt-1 uppercase tracking-[0.2em]">World Chain Protocol</p>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-matrix-green/10 text-matrix-green border-matrix-green/50 px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-matrix-green mr-2 animate-pulse" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                className="h-8 px-4 text-[10px] border-matrix-green/50 text-matrix-green hover:bg-matrix-green/20"
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

        {/* Action Sections */}
        <div className="space-y-6">
          <StakeSection 
            availableBalanceFormatted={availableBalanceFormatted}
            handleStake={handleStake}
            loading={loading}
          />
          
          <UnstakeSection 
            stakedBalanceFormatted={stakedBalanceFormatted}
            handleUnstake={handleUnstake}
            loading={loading}
            isUnlocked={isUnlocked}
          />

          <RewardsSection 
            pendingRewardsFormatted={pendingRewardsFormatted}
            handleClaim={handleClaim}
            loading={loading}
            isConnected={isConnected}
          />
        </div>

        {/* System Logs / Info */}
        <div className="space-y-4">
          <ContractInfo totalStaked={stakedBalance} contractBalance={availableBalance} />
          <TransactionHistory />
        </div>

        <footer className="text-center py-6 border-t border-matrix-green/10">
          <div className="flex flex-col items-center gap-2 text-[10px] text-matrix-green/40 font-mono">
            <span className="flex items-center gap-1"><Info className="w-3 h-3" /> PROTOCOL_VERSION: 2.0.0-PRO (2026)</span>
            <span>{"// SECURITY_VERIFIED_ON_CHAIN"}</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

function StakeSection({
    availableBalanceFormatted,
    handleStake,
    loading
  }: {
    availableBalanceFormatted: number,
    handleStake: (amount: number) => Promise<void>,
    loading: boolean
  }) {
  return (
    <Card className="bg-black/60 border-matrix-green/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,0,0.1)] overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-matrix-green/80 flex items-center gap-1">
            <Activity className="w-3 h-3" /> STAKE_TOKENS
          </span>
          <Badge variant="outline" className="text-[10px] border-matrix-green/20 text-matrix-green">
            AVAILABLE: {availableBalanceFormatted.toFixed(2)}
          </Badge>
        </div>
        <StakeForm
          availableBalance={availableBalanceFormatted}
          onSuccess={() => handleStake(0)}
          loading={loading}
        />
      </div>
    </Card>
  )
}

function UnstakeSection({
    stakedBalanceFormatted,
    handleUnstake,
    loading,
    isUnlocked
  }: {
    stakedBalanceFormatted: number,
    handleUnstake: (amount: number) => Promise<void>,
    loading: boolean,
    isUnlocked: boolean
  }) {
  return (
    <Card className="bg-black/60 border-matrix-cyan/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.05)] overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-matrix-cyan/80 flex items-center gap-1">
            <Activity className="w-3 h-3" /> UNSTAKE_TOKENS
          </span>
          <Badge variant="outline" className="text-[10px] border-matrix-cyan/20 text-matrix-cyan">
            STAKED: {stakedBalanceFormatted.toFixed(2)}
          </Badge>
        </div>
        <UnstakeForm
          availableToUnstake={stakedBalanceFormatted}
          onSuccess={() => handleUnstake(0)}
          loading={loading}
        />
      </div>
    </Card>
  )
}

function RewardsSection({
    pendingRewardsFormatted,
    handleClaim,
    loading,
    isConnected
  }: {
    pendingRewardsFormatted: number,
    handleClaim: (amount: number) => Promise<void>,
    loading: boolean,
    isConnected: boolean
  }) {
  return (
    <Card className="bg-black/40 border-matrix-cyan/30 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-matrix-cyan/60 uppercase">Claimable_Rewards</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-matrix-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
              {pendingRewardsFormatted.toFixed(4)}
            </span>
            <span className="text-[10px] text-matrix-cyan/40">MTXs</span>
          </div>
        </div>
        <Button
          onClick={() => handleClaim(0)}
          disabled={loading || pendingRewardsFormatted === 0 || !isConnected}
          className="bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50 hover:bg-matrix-cyan/30 font-mono text-sm px-8 h-10 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
        >
          {loading ? "CLAIMING..." : "CLAIM_NOW"}
        </Button>
      </CardContent>
    </Card>
  )
}
