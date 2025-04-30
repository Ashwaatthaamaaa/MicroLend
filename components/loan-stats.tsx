"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUp, CheckCircle, CircleDollarSign, Clock, DollarSign, Users } from "lucide-react"
import { getPlatformStats } from "@/frontend/lib/loan-contract"

export function LoanStats() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoanCount: 0,
    totalVolume: 0,
    averageInterestRate: 0,
    totalBorrowers: 0,
    successRate: 0,
    completedLoans: 0,
    defaultedLoans: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getPlatformStats()
        setStats({
          totalLoans: data.totalLoans,
          activeLoanCount: data.activeLoanCount,
          totalVolume: data.totalVolume,
          averageInterestRate: data.averageInterestRate,
          totalBorrowers: data.totalBorrowers,
          successRate: data.successRate,
          completedLoans: data.completedLoans,
          defaultedLoans: data.defaultedLoans
        })
      } catch (error) {
        console.error("Failed to fetch platform stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <section className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">Platform Statistics</h2>
        <p className="max-w-[700px] text-muted-foreground">Real-time statistics of our microfinance platform</p>
      </div>
      
      {/* Main stats with icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-blue-500" />
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} ETH</div>
            <p className="text-xs text-muted-foreground">Total value of all loans</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoanCount}</div>
            <p className="text-xs text-muted-foreground">Currently active loans</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Community Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBorrowers}</div>
            <p className="text-xs text-muted-foreground">Unique borrowers on the platform</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-amber-500" />
              Avg. Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageInterestRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Average interest rate across all loans</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Success rate with progress bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Loan Repayment Success Rate
          </CardTitle>
          <CardDescription>Percentage of loans that have been successfully repaid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                <span className="text-muted-foreground text-sm">success rate</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.completedLoans} completed / {stats.defaultedLoans} defaulted
              </div>
            </div>
            <Progress
              value={stats.successRate}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

