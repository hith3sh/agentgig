"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { polygon, polygonMumbai } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const config = getDefaultConfig({
  appName: "AgentGig",
  projectId: "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [polygonMumbai, polygon],
  ssr: true,
})

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <ConvexProvider client={convex}>
                {children}
              </ConvexProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
