import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { MiniKitInit } from "../components/minikit-init"
import "./globals.css"
import type { Metadata } from "next"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Matrix Stake",
  description: "Stake your tokens and earn rewards with 1-day unlock period in the World App ecosystem.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-black text-white">
        <MiniKitInit />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
