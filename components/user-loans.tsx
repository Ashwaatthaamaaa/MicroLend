"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getUserLoans, repayLoan } from "@/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"

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

    fetchLoans()
  }, [])

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

  if (loading) {
    return <div className="text-center py-8">Loading your loans...</div>
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">You haven't created any loans yet.</p>
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
                <CardDescription>Created on {new Date(loan.createdAt * 1000).toLocaleDateString()}</CardDescription>
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
  )
}

