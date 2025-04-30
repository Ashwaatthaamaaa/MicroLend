"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserInvestments, claimRepayment } from "@/frontend/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "./wallet-provider"
import { RefreshCcw } from "lucide-react"

type Investment = {
  loanId: string
  borrower: string
  amount: number
  purpose: string
  interestRate: number
  investedAmount: number
  status: "funding" | "active" | "completed" | "defaulted"
  createdAt: number
  dueDate: number
}

export function UserInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingLoanId, setClaimingLoanId] = useState<string | null>(null)
  const { toast } = useToast()
  const { isConnected, address, refreshData, isRefreshing } = useWallet()

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setLoading(true)
        const data = await getUserInvestments()
        setInvestments(data)
      } catch (error) {
        console.error("Failed to fetch user investments:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && address) {
      fetchInvestments()
    } else {
      // If wallet not connected, show empty list
      setInvestments([])
      setLoading(false)
    }
  }, [isConnected, address])

  const handleClaim = async (loanId: string) => {
    try {
      setClaimingLoanId(loanId)
      await claimRepayment(loanId)

      // Update the investments list
      setInvestments((prevInvestments) => prevInvestments.filter((investment) => investment.loanId !== loanId))

      toast({
        title: "Repayment Claimed",
        description: "You have successfully claimed your repayment",
      })
    } catch (error) {
      console.error("Failed to claim repayment:", error)
      toast({
        title: "Transaction Failed",
        description: "Failed to claim repayment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClaimingLoanId(null)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const data = await getUserInvestments()
      setInvestments(data)
      toast({
        title: "Data Refreshed",
        description: "Your investments have been refreshed with the latest data",
      })
    } catch (error) {
      console.error("Failed to refresh investments:", error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh investment data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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

  const calculateReturn = (investedAmount: number, interestRate: number) => {
    return investedAmount * (1 + interestRate / 100)
  }

  if (loading || isRefreshing) {
    return <div className="text-center py-8">Loading your investments...</div>
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">Please connect your wallet to view your investments</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Investments</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {investments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You haven't invested in any loans yet.</p>
          <Button asChild className="mt-4">
            <Link href="/loans">Browse Available Loans</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((investment) => (
            <Card key={investment.loanId}>
              <CardHeader className="pb-3">
                <div className="flex justify-between">
                  <Badge className={getStatusColor(investment.status)}>
                    {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-2">{investment.purpose}</CardTitle>
                <CardDescription>Borrower: {formatAddress(investment.borrower)}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invested Amount</p>
                    <p className="font-medium">{investment.investedAmount} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest</p>
                    <p className="font-medium">{investment.interestRate}%</p>
                  </div>
                  {investment.status === "completed" ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Return</p>
                      <p className="font-medium">
                        {calculateReturn(investment.investedAmount, investment.interestRate).toFixed(4)} ETH
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Return</p>
                      <p className="font-medium">
                        {calculateReturn(investment.investedAmount, investment.interestRate).toFixed(4)} ETH
                      </p>
                    </div>
                  )}
                  {investment.status === "active" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Due In</p>
                      <p className="font-medium">{getDaysLeft(investment.dueDate)} days</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Earned</p>
                    <p className="font-medium">
                      {calculateReturn(investment.investedAmount, investment.interestRate).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {investment.status === "completed" ? (
                  <Button
                    className="w-full"
                    onClick={() => handleClaim(investment.loanId)}
                    disabled={claimingLoanId === investment.loanId}
                  >
                    {claimingLoanId === investment.loanId ? "Processing..." : "Claim Repayment"}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/loans/${investment.loanId}`}>View Details</Link>
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

