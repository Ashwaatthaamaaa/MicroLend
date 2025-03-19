"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getLoans, fundLoan } from "@/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"

type Loan = {
  id: string
  borrower: string
  amount: number
  purpose: string
  interestRate: number
  duration: number
  funded: number
  status: "funding" | "active" | "completed" | "defaulted"
  createdAt: number
}

export function LoansList() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [fundingLoanId, setFundingLoanId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true)
        const data = await getLoans()
        setLoans(data)
      } catch (error) {
        console.error("Failed to fetch loans:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLoans()
  }, [])

  const handleFund = async (loanId: string, amount: number) => {
    try {
      setFundingLoanId(loanId)
      await fundLoan(loanId, amount)

      // Update the loans list
      setLoans((prevLoans) =>
        prevLoans.map((loan) => (loan.id === loanId ? { ...loan, funded: loan.funded + amount } : loan)),
      )

      toast({
        title: "Loan Funded",
        description: `You have successfully funded ${amount} MATIC to this loan`,
      })
    } catch (error) {
      console.error("Failed to fund loan:", error)
      toast({
        title: "Transaction Failed",
        description: "Failed to fund loan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFundingLoanId(null)
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

  if (loading) {
    return <div className="text-center py-8">Loading loans...</div>
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">No loans available at the moment.</p>
        <Link href="/create">
          <Button>Create a Loan</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {loans.map((loan) => (
        <Card key={loan.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{loan.purpose}</CardTitle>
                <CardDescription>By {formatAddress(loan.borrower)}</CardDescription>
              </div>
              <Badge className={getStatusColor(loan.status)}>
                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
              </Badge>
            </div>
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
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(loan.createdAt * 1000).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Funding Progress</span>
                <span>{Math.round((loan.funded / loan.amount) * 100)}%</span>
              </div>
              <Progress value={(loan.funded / loan.amount) * 100} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            {loan.status === "funding" ? (
              <div className="flex flex-col w-full gap-2">
                <Button onClick={() => handleFund(loan.id, 0.1)} disabled={fundingLoanId === loan.id}>
                  {fundingLoanId === loan.id ? "Processing..." : "Fund This Loan"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/loans/${loan.id}`}>View Details</Link>
                </Button>
              </div>
            ) : (
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/loans/${loan.id}`}>View Details</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

