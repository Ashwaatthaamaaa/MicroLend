import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"
import { ConnectWallet } from "@/components/connect-wallet"
import { CreateLoanForm } from "@/components/create-loan-form"

export default function Create() {
  return (
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
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
            <ConnectWallet />
          </div>
        </header>
        <main className="container px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Loan Request</h1>
              <p className="text-muted-foreground">Specify the details of your loan request</p>
            </div>

            <CreateLoanForm />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

