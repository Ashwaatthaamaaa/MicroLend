"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getLoans, fundLoan, getUserLoans, getAvailableLoans, getConnectedAccount, debugFundLoan } from "@/frontend/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FundLoanDialog } from "./fund-loan-dialog"

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
  percentageFunded?: number
}

export function LoansList() {
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([])
  const [myLoans, setMyLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [fundingLoanId, setFundingLoanId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true)
        const [userLoans, available] = await Promise.all([
          getUserLoans(),
          getAvailableLoans()
        ])
        setMyLoans(userLoans)
        setAvailableLoans(available)
      } catch (error) {
        console.error("Failed to fetch loans:", error)
        toast({
          title: "Error",
          description: "Failed to fetch loans. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLoans()
  }, [])

  const handleFund = async (loanId: string) => {
    try {
      setFundingLoanId(loanId)
      
      // Find the loan to display information about what's being funded
      const loan = availableLoans.find(l => l.id === loanId);
      if (!loan) {
        throw new Error("Loan not found in available loans list");
      }
      
      // Show initiating funding toast
      toast({
        title: "Initiating Funding",
        description: `Funding loan for ${loan.amount} ETH to ${formatAddress(loan.borrower)}...`,
      });
      
      // Use the debug function instead of regular fundLoan
      console.log("Using debug fund loan function for better error tracking...");
      const tx = await debugFundLoan(loanId);
      
      toast({
        title: "Transaction Submitted",
        description: "Your funding transaction has been submitted to the blockchain. Waiting for confirmation...",
      });
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // Show transaction confirmed toast
      toast({
        title: "Transaction Confirmed",
        description: "Your funding transaction has been confirmed. Checking loan status...",
      });
      
      // Get fresh loan data to ensure we have the latest status
      const [userLoans, available] = await Promise.all([
        getUserLoans(),
        getAvailableLoans()
      ]);
      
      // Update with fresh data from blockchain
      setMyLoans(userLoans);
      setAvailableLoans(available);
      
      // Check if the loan is still in the available loans list
      const isStillAvailable = available.some(l => l.id === loanId);
      
      if (!isStillAvailable) {
        // If loan is no longer available, it was successfully fully funded
        toast({
          title: "Loan Successfully Funded",
          description: `Full amount of ${loan.amount} ETH has been transferred to the borrower!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Loan Partially Funded",
          description: "Your contribution was successful, but the loan still needs more funding to be completed.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Failed to fund loan:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to fund loan. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by the dialog
    } finally {
      setFundingLoanId(null);
    }
  };

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

  const LoanCard = ({ loan, showFundButton = true }: { loan: Loan, showFundButton?: boolean }) => (
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
            <p className="font-medium">{loan.amount} ETH</p>
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
        <div className="flex flex-col w-full gap-2">
          {loan.status === "funding" && showFundButton && (
            <FundLoanDialog
              loanId={loan.id}
              amount={loan.amount}
              onFund={() => handleFund(loan.id)}
              disabled={fundingLoanId === loan.id}
            />
          )}
          <Button variant="outline" asChild>
            <Link href={`/loans/${loan.id}`}>View Details</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  if (loading) {
    return <div className="text-center py-8">Loading loans...</div>
  }

  if (availableLoans.length === 0 && myLoans.length === 0) {
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
    <Tabs defaultValue="available" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="available">Available Loans</TabsTrigger>
        <TabsTrigger value="my-loans">My Loan Requests</TabsTrigger>
      </TabsList>
      
      <TabsContent value="available" className="mt-0">
        <div className="grid gap-6">
          {availableLoans.length === 0 ? (
            <div className="text-center py-8">
              <p>No loans available for funding at the moment.</p>
            </div>
          ) : (
            availableLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} showFundButton={true} />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="my-loans" className="mt-0">
        <div className="grid gap-6">
          {myLoans.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4">You haven't created any loan requests yet.</p>
              <Link href="/create">
                <Button>Create a Loan</Button>
              </Link>
            </div>
          ) : (
            myLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} showFundButton={false} />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

