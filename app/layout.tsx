"use client"

import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { MiniKit } from "@worldcoin/minikit-js"
import { useEffect } from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

function MiniKitInit() {
  useEffect(() => {
    MiniKit.install()
  }, [])
  return null
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <MiniKitInit />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
