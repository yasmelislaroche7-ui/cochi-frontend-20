"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "@/lib/contracts/config"

interface ContractInfoProps {
  totalStaked?: bigint
  contractBalance?: bigint
}

export function ContractInfo({ totalStaked = 0n, contractBalance = 0n }: ContractInfoProps) {
  const { toast } = useToast()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <Card className="border-matrix-green/30 bg-black/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-matrix-green flex items-center justify-between">
          Contract Info
          <Badge variant="outline" className="bg-matrix-green/20 text-matrix-green border-matrix-green/50">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Staking Contract</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-black/50 px-2 py-1 rounded border border-matrix-green/30 text-matrix-green flex-1">
              {formatAddress(STAKING_CONTRACT_ADDRESS)}
            </code>
            <button
              onClick={() => copyToClipboard(STAKING_CONTRACT_ADDRESS, "Staking contract address")}
              className="p-2 hover:bg-matrix-green/10 rounded"
            >
              <Copy className="w-4 h-4 text-matrix-green" />
            </button>
            <a
              href={`https://worldscan.org/address/${STAKING_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-matrix-green/10 rounded"
            >
              <ExternalLink className="w-4 h-4 text-matrix-green" />
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Token Contract</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-black/50 px-2 py-1 rounded border border-matrix-green/30 text-matrix-green flex-1">
              {formatAddress(TOKEN_CONTRACT_ADDRESS)}
            </code>
            <button
              onClick={() => copyToClipboard(TOKEN_CONTRACT_ADDRESS, "Token contract address")}
              className="p-2 hover:bg-matrix-green/10 rounded"
            >
              <Copy className="w-4 h-4 text-matrix-green" />
            </button>
            <a
              href={`https://worldscan.org/address/${TOKEN_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-matrix-green/10 rounded"
            >
              <ExternalLink className="w-4 h-4 text-matrix-green" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-matrix-green/20">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Staked</p>
            <p className="text-lg font-mono font-bold text-matrix-green">{(Number(totalStaked) / 1e18).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pool Balance</p>
            <p className="text-lg font-mono font-bold text-matrix-cyan">
              {(Number(contractBalance) / 1e18).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
