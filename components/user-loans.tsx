"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getUserLoans, repayLoan } from "@/frontend/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "./wallet-provider"
import { RefreshCcw } from "lucide-react"

type Loan = {
  id: string
  amount: number
  purpose: string
  interestRate: number
  duration: number
  funded: number
  status: "funding" | "active" | "completed" | "defaulted"
  createdAt: number
  dueDate: number
}

export function UserLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null)
  const { toast } = useToast()
  const { isConnected, address, refreshData, isRefreshing } = useWallet()

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true)
        const data = await getUserLoans()
        setLoans(data)
      } catch (error) {
        console.error("Failed to fetch user loans:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && address) {
      fetchLoans()
    } else {
      // If wallet not connected, show empty list
      setLoans([])
      setLoading(false)
    }
  }, [isConnected, address])

  const handleRepay = async (loanId: string) => {
    try {
      setRepayingLoanId(loanId)
      await repayLoan(loanId)

      // Update the loans list
      setLoans((prevLoans) => prevLoans.map((loan) => (loan.id === loanId ? { ...loan, status: "completed" } : loan)))

      toast({
        title: "Loan Repaid",
        description: "You have successfully repaid your loan",
      })
    } catch (error) {
      console.error("Failed to repay loan:", error)
      toast({
        title: "Transaction Failed",
        description: "Failed to repay loan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRepayingLoanId(null)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const data = await getUserLoans()
      setLoans(data)
      toast({
        title: "Data Refreshed",
        description: "Your loans have been refreshed with the latest data",
      })
    } catch (error) {
      console.error("Failed to refresh user loans:", error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh loan data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "funding":
        return "bg-blue-500"
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "defaulted":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDaysLeft = (dueDate: number) => {
    if (!dueDate) return 0;
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = dueDate - now;
    const daysLeft = Math.ceil(secondsLeft / (60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  }

  if (loading || isRefreshing) {
    return <div className="text-center py-8">Loading your loans...</div>
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">Please connect your wallet to view your loans</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Loans</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {loans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't created any loans yet.</p>
          <Button asChild className="mt-4">
            <Link href="/create">Create Your First Loan</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <Badge className={getStatusColor(loan.status)}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-2">{loan.purpose}</CardTitle>
                <CardDescription>Created on {new Date(loan.createdAt * 1000).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">{loan.amount} MATIC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest</p>
                    <p className="font-medium">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{loan.duration} days</p>
                  </div>
                  {loan.status === "active" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Due In</p>
                      <p className="font-medium">{getDaysLeft(loan.dueDate)} days</p>
                    </div>
                  )}
                </div>

                {loan.status === "funding" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Funding Progress</span>
                      <span>{Math.round((loan.funded / loan.amount) * 100)}%</span>
                    </div>
                    <Progress value={(loan.funded / loan.amount) * 100} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {loan.status === "active" ? (
                  <Button className="w-full" onClick={() => handleRepay(loan.id)} disabled={repayingLoanId === loan.id}>
                    {repayingLoanId === loan.id ? "Processing..." : "Repay Loan"}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/loans/${loan.id}`}>View Details</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

