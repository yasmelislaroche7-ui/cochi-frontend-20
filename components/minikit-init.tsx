"use client"

import { MiniKit } from "@worldcoin/minikit-js"
import { useEffect } from "react"

export function MiniKitInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        MiniKit.install()
        console.log("MiniKit installed successfully")
      } catch (e) {
        console.error("Error installing MiniKit:", e)
      }
    }
  }, [])
  return null
}
