import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider } from "@/components/theme-provider"
import { ConnectWallet } from "@/components/connect-wallet"
import { UserLoans } from "@/components/user-loans"
import { UserInvestments } from "@/components/user-investments"
import { UserStats } from "@/components/user-stats"
import { PlatformStats } from "@/components/platform-stats"
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
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
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Manage your loans and investments</p>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Your Summary</h2>
              <p className="text-muted-foreground">Overview of your lending and borrowing activity</p>
            </div>

            <UserStats />
            
            <Separator className="my-2" />
            
            <PlatformStats />
            
            <Separator className="my-2" />

            <Tabs defaultValue="loans" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="loans">My Loans</TabsTrigger>
                <TabsTrigger value="investments">My Investments</TabsTrigger>
              </TabsList>
              <TabsContent value="loans" className="mt-6">
                <UserLoans />
              </TabsContent>
              <TabsContent value="investments" className="mt-6">
                <UserInvestments />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

