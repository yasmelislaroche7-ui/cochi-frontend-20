"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, CheckCircle2 } from "lucide-react"
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js"
import { useEffect, useRef } from "react"
import { useStaking } from "@/hooks/use-staking"

interface WorldIdVerifyProps {
  onVerified?: (proof: any) => void
  autoVerify?: boolean
}

export function WorldIdVerify({ onVerified, autoVerify }: WorldIdVerifyProps) {
  const { address } = useStaking()
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const autoVerifyTried = useRef(false)

  useEffect(() => {
    if (autoVerify && !isVerified && !loading && !autoVerifyTried.current) {
      // Don't auto-verify if we're not in the World App environment properly
      if (typeof window !== "undefined" && window.location.hostname === "localhost") return
      
      autoVerifyTried.current = true
      // Longer delay to ensure MiniKit is fully stable and wallet connection is finalized
      setTimeout(() => {
        handleVerify()
      }, 2000)
    }
  }, [autoVerify, isVerified])

  const handleVerify = async () => {
    setLoading(true)
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit not installed or ready. Please try again.")
      }
      
      // Production verified App ID and Action
      const action = "stake-verification";
      const appId = "app_9e44184e40f240dfb5b8976bde22b548";
      
      console.log("Starting verification with action:", action, "App ID:", appId);
      
      const result = await MiniKit.commandsAsync.verify({
        action: action,
        signal: address || "", // Using address as signal for better tracking
        verification_level: VerificationLevel.Orb,
      })

      if (result.finalPayload.status === "error") {
        const errorMsg = result.finalPayload.error_code || "Verification failed";
        console.error("Verification Error Payload:", result.finalPayload);
        throw new Error(errorMsg)
      }

      if (result.finalPayload.status === "success") {
        console.log("Verification Success!");
        setIsVerified(true)
        onVerified?.(result.finalPayload)
      }
    } catch (error: any) {
      console.error("Verification error caught:", error)
      alert(`Verification Error: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (isVerified) {
    return (
      <Card className="border-matrix-green bg-black/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-matrix-green">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="font-semibold">Verified Human</p>
              <p className="text-sm text-matrix-green/70">World ID verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-matrix-green/30 bg-black/50 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-matrix-green" />
            <div>
              <p className="font-semibold text-foreground">Verify with World ID</p>
              <p className="text-sm text-muted-foreground">Verify you're a real human</p>
            </div>
          </div>
          <Button
            onClick={handleVerify}
            disabled={loading}
            variant="outline"
            className="border-matrix-green text-matrix-green bg-transparent"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
