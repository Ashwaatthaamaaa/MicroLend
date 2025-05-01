import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWallet } from "@/components/connect-wallet"
import { LoanStats } from "@/components/loan-stats"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">MicroLend</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/loans" className="text-sm font-medium hover:underline underline-offset-4">
              Browse Loans
            </Link>
            <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4">
              Create Loan
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </div>
      </header>
      <main className="container px-4 md:px-6 py-8 md:py-12 space-y-10">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
          <div className="flex max-w-[980px] flex-col items-start gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              Decentralized Microfinance <br className="hidden sm:inline" />
              for Everyone
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Access and provide microloans on the Ethereum blockchain. Fast, secure, and accessible financial services
              for all.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/create">
              <Button size="lg">Request a Loan</Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline" size="lg">
                Fund a Loan
              </Button>
            </Link>
          </div>
        </section>

        <LoanStats />

        <section className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">How It Works</h2>
            <p className="max-w-[700px] text-muted-foreground">
              MicroLend connects borrowers with lenders in a transparent, decentralized environment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request</CardTitle>
                <CardDescription>Create a loan request with your terms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specify the amount, purpose, duration, and interest rate you're looking for.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fund</CardTitle>
                <CardDescription>Browse and fund loan requests</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review borrower profiles and loan details before committing your funds.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Repay</CardTitle>
                <CardDescription>Repay loans according to terms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Make repayments directly through the platform, building your reputation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MicroLend. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              About
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

