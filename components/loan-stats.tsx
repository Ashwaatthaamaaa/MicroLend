"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLoanStats } from "@/lib/loan-contract"

export function LoanStats() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalVolume: 0,
    avgInterestRate: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getLoanStats()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch loan stats:", error)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-muted-foreground">Loans created on the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-muted-foreground">Currently active loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} MATIC</div>
            <p className="text-xs text-muted-foreground">Total value of all loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgInterestRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Average interest rate across all loans</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

