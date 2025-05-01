import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from '@/components/wallet-provider'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'MicroLend',
  description: 'Decentralized Microloans on the Ethereum Network',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            {children}
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
