"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Gift } from "lucide-react"

interface Transaction {
  type: "stake" | "unstake" | "claim"
  amount: string
  timestamp: Date
  txHash: string
}

interface TransactionHistoryProps {
  transactions?: Transaction[]
}

export function TransactionHistory({ transactions = [] }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "stake":
        return <ArrowUpRight className="w-4 h-4 text-matrix-green" />
      case "unstake":
        return <ArrowDownRight className="w-4 h-4 text-matrix-orange" />
      case "claim":
        return <Gift className="w-4 h-4 text-matrix-cyan" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "stake":
        return "bg-matrix-green/20 text-matrix-green border-matrix-green/50"
      case "unstake":
        return "bg-matrix-orange/20 text-matrix-orange border-matrix-orange/50"
      case "claim":
        return "bg-matrix-cyan/20 text-matrix-cyan border-matrix-cyan/50"
      default:
        return ""
    }
  }

  return (
    <Card className="border-matrix-green/30 bg-black/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-matrix-green">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-matrix-green/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-matrix-green/10 flex items-center justify-center">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getTypeColor(tx.type)}`}>
                      {tx.type.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-sm text-foreground">{tx.amount} WORLD</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tx.timestamp.toLocaleString()}</p>
                </div>
              </div>
              <a
                href={`https://worldscan.org/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-matrix-green hover:underline"
              >
                View →
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
