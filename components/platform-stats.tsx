"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Clock, DollarSign, Landmark, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { getPlatformStats, onWalletChange } from "@/frontend/lib/loan-contract"

export function PlatformStats() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalVolume: 0,
    activeLoanCount: 0,
    activeLoanVolume: 0,
    totalInvestors: 0,
    totalBorrowers: 0,
    averageInterestRate: 0,
    averageLoanDuration: 0,
    completedLoans: 0,
    defaultedLoans: 0,
    successRate: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await getPlatformStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch platform stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Set up listener for wallet changes
    const unsubscribe = onWalletChange(() => {
      fetchStats()
    })
    
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Platform Statistics</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchStats} 
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} ETH</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeLoanVolume.toFixed(2)} ETH currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Total Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeLoanCount} loans currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Platform Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBorrowers + stats.totalInvestors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalBorrowers} borrowers, {stats.totalInvestors} investors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Loan Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageInterestRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.averageLoanDuration)} days average duration
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional stats cards */}
      <Tabs defaultValue="volume" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume">Loan Volume</TabsTrigger>
          <TabsTrigger value="performance">Loan Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="volume" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Volume Distribution</CardTitle>
              <CardDescription>Current and historical loan volumes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span>Active Loans</span>
                    </div>
                    <span>{stats.activeLoanVolume.toFixed(2)} ETH</span>
                  </div>
                  <Progress 
                    value={stats.totalVolume > 0 ? (stats.activeLoanVolume / stats.totalVolume) * 100 : 0} 
                    className="h-2 bg-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Completed Loans</span>
                    </div>
                    <span>
                      {stats.totalVolume > 0 
                        ? (((stats.totalVolume - stats.activeLoanVolume) * stats.completedLoans) / 
                           (stats.completedLoans + stats.defaultedLoans || 1)).toFixed(2) 
                        : "0.00"} ETH
                    </span>
                  </div>
                  <Progress 
                    value={stats.totalVolume > 0 
                      ? ((stats.totalVolume - stats.activeLoanVolume) * stats.completedLoans) / 
                        (stats.completedLoans + stats.defaultedLoans || 1) / stats.totalVolume * 100 
                      : 0} 
                    className="h-2 bg-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span>Defaulted Loans</span>
                    </div>
                    <span>
                      {stats.totalVolume > 0 
                        ? (((stats.totalVolume - stats.activeLoanVolume) * stats.defaultedLoans) / 
                           (stats.completedLoans + stats.defaultedLoans || 1)).toFixed(2) 
                        : "0.00"} ETH
                    </span>
                  </div>
                  <Progress 
                    value={stats.totalVolume > 0 
                      ? ((stats.totalVolume - stats.activeLoanVolume) * stats.defaultedLoans) / 
                        (stats.completedLoans + stats.defaultedLoans || 1) / stats.totalVolume * 100 
                      : 0} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Success Rate</CardTitle>
              <CardDescription>Performance of loans on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="relative h-40 w-40">
                  {/* Simple circle chart */}
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={`${stats.successRate * 2.51} ${251 - stats.successRate * 2.51}`}
                      strokeDashoffset="62.75"
                      className="text-green-500"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold">{stats.successRate.toFixed(1)}%</span>
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold">{stats.completedLoans}</div>
                  <div className="text-xs text-muted-foreground">Completed Loans</div>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold">{stats.defaultedLoans}</div>
                  <div className="text-xs text-muted-foreground">Defaulted Loans</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User and Loan Distribution</CardTitle>
              <CardDescription>Platform borrower and investor metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Borrowers vs Investors</span>
                    <span>{stats.totalBorrowers} / {stats.totalInvestors}</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-700">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ 
                        width: `${(stats.totalBorrowers / (stats.totalBorrowers + stats.totalInvestors || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Loans by Status</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ 
                        width: `${(stats.activeLoanCount / stats.totalLoans || 0) * 100}%` 
                      }}
                    ></div>
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ 
                        width: `${(stats.completedLoans / stats.totalLoans || 0) * 100}%` 
                      }}
                    ></div>
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ 
                        width: `${(stats.defaultedLoans / stats.totalLoans || 0) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>Active ({stats.activeLoanCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Completed ({stats.completedLoans})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span>Defaulted ({stats.defaultedLoans})</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Interest Rate</div>
                      <div className="text-lg font-medium">{stats.averageInterestRate.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Loan Duration</div>
                      <div className="text-lg font-medium">{Math.round(stats.averageLoanDuration)} days</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 