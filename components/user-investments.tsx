"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserInvestments, claimRepayment } from "@/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"

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

    fetchInvestments()
  }, [])

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
    const now = Math.floor(Date.now() / 1000)
    const daysLeft = Math.ceil((dueDate - now) / (60 * 60 * 24))
    return daysLeft > 0 ? daysLeft : 0
  }

  const calculateReturn = (investedAmount: number, interestRate: number) => {
    return investedAmount * (1 + interestRate / 100)
  }

  if (loading) {
    return <div className="text-center py-8">Loading your investments...</div>
  }

  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">You haven't invested in any loans yet.</p>
        <Link href="/loans">
          <Button>Browse Loans</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {investments.map((investment) => (
        <Card key={investment.loanId}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{investment.purpose}</CardTitle>
                <CardDescription>Borrower: {formatAddress(investment.borrower)}</CardDescription>
              </div>
              <Badge className={getStatusColor(investment.status)}>
                {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invested</p>
                <p className="font-medium">{investment.investedAmount} MATIC</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest</p>
                <p className="font-medium">{investment.interestRate}%</p>
              </div>
              {investment.status === "completed" ? (
                <div>
                  <p className="text-sm text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {calculateReturn(investment.investedAmount, investment.interestRate).toFixed(4)} MATIC
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Expected Return</p>
                  <p className="font-medium">
                    {calculateReturn(investment.investedAmount, investment.interestRate).toFixed(4)} MATIC
                  </p>
                </div>
              )}
              {investment.status === "active" && (
                <div>
                  <p className="text-sm text-muted-foreground">Due In</p>
                  <p className="font-medium">{getDaysLeft(investment.dueDate)} days</p>
                </div>
              )}
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
  )
}

