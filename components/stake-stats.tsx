import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Wallet, Coins } from "lucide-react"

interface StakeStatsProps {
  stakedBalance: number
  apy: number
  estimatedRewards: number
}

export function StakeStats({ stakedBalance, apy, estimatedRewards }: StakeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-matrix-green/30 bg-black/50 backdrop-blur shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-matrix-green/60 font-mono">TOTAL_STAKED</p>
              <p className="text-2xl font-bold font-mono text-matrix-green">{stakedBalance.toFixed(2)}</p>
              <p className="text-xs text-matrix-green/40 font-mono">WORLD</p>
            </div>
            <div className="w-12 h-12 bg-matrix-green/10 rounded-lg flex items-center justify-center border border-matrix-green/30">
              <Wallet className="w-6 h-6 text-matrix-green" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-matrix-cyan/30 bg-black/50 backdrop-blur shadow-[0_0_15px_rgba(0,255,255,0.1)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-matrix-cyan/60 font-mono">APY_RATE</p>
              <p className="text-2xl font-bold font-mono text-matrix-cyan">{apy}%</p>
              <p className="text-xs text-matrix-green font-mono">+ACTIVE</p>
            </div>
            <div className="w-12 h-12 bg-matrix-cyan/10 rounded-lg flex items-center justify-center border border-matrix-cyan/30">
              <TrendingUp className="w-6 h-6 text-matrix-cyan" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-matrix-orange/30 bg-black/50 backdrop-blur shadow-[0_0_15px_rgba(255,150,0,0.1)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-matrix-orange/60 font-mono">DAILY_REWARDS</p>
              <p className="text-2xl font-bold font-mono text-matrix-orange">{estimatedRewards.toFixed(4)}</p>
              <p className="text-xs text-matrix-orange/40 font-mono">WORLD</p>
            </div>
            <div className="w-12 h-12 bg-matrix-orange/10 rounded-lg flex items-center justify-center border border-matrix-orange/30">
              <Coins className="w-6 h-6 text-matrix-orange" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
