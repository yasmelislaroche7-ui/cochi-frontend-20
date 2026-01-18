import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Wallet, Coins } from "lucide-react"

interface StakeStatsProps {
  stakedBalance: number
  apy: number
  estimatedRewards: number
}

export function StakeStats({ stakedBalance, apy, estimatedRewards }: StakeStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="border-matrix-green/30 bg-black/50 backdrop-blur p-2 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
        <div className="text-center">
          <p className="text-[10px] text-matrix-green/60 font-mono leading-tight">STAKED</p>
          <p className="text-sm font-bold font-mono text-matrix-green truncate">{stakedBalance.toFixed(1)}</p>
        </div>
      </Card>

      <Card className="border-matrix-cyan/30 bg-black/50 backdrop-blur p-2 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
        <div className="text-center">
          <p className="text-[10px] text-matrix-cyan/60 font-mono leading-tight">APY</p>
          <p className="text-sm font-bold font-mono text-matrix-cyan">{apy}%</p>
        </div>
      </Card>

      <Card className="border-matrix-orange/30 bg-black/50 backdrop-blur p-2 shadow-[0_0_10px_rgba(255,150,0,0.1)]">
        <div className="text-center">
          <p className="text-[10px] text-matrix-orange/60 font-mono leading-tight">DAILY</p>
          <p className="text-sm font-bold font-mono text-matrix-orange truncate">{estimatedRewards.toFixed(3)}</p>
        </div>
      </Card>
    </div>
  )
}
