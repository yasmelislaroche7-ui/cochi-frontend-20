"use client"

import { MiniKit } from "@worldcoin/minikit-js"
import { useEffect } from "react"

export function MiniKitInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      MiniKit.install()
      console.log("MiniKit installed")
    }
  }, [])
  return null
}
