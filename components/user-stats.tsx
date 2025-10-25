"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserStats } from "@/frontend/lib/loan-contract"

export function UserStats() {
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    totalInvested: 0,
    activeLoans: 0,
    activeInvestments: 0,
    reputation: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUserStats()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch user stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBorrowed.toFixed(2)} ETH</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInvested.toFixed(2)} ETH</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeLoans}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeInvestments}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reputation}/100</div>
        </CardContent>
      </Card>
    </div>
  )
}

