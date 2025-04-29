"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, DollarSign, Percent, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider } from "@/components/theme-provider"
import { ConnectWallet } from "@/components/connect-wallet"
import { getLoanDetails, fundLoan, repayLoan, formatEther, debugFundLoan } from "@/frontend/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"
import { LoanRepaymentSchedule } from "@/components/loan-repayment-schedule"
import { LoanActivity } from "@/components/loan-activity"

export default function LoanDetails() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loan, setLoan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true)
        const loanId = params.id as string
        const loanData = await getLoanDetails(loanId)
        setLoan(loanData)
      } catch (error) {
        console.error("Failed to fetch loan details:", error)
        toast({
          title: "Error",
          description: "Failed to load loan details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLoanDetails()
  }, [params.id, toast])

  const handleFund = async () => {
    if (!loan) return

    try {
      setProcessing(true)
      
      toast({
        title: "Initiating Funding",
        description: `Funding loan for ${formatEther(loan.amount)} MATIC to borrower account...`,
      });
      
      console.log("Using debug fund loan function for better error tracking...");
      const tx = await debugFundLoan(loan.id)
      
      toast({
        title: "Transaction Submitted",
        description: "Your funding transaction has been submitted. Waiting for confirmation...",
      });
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait()
      console.log("Transaction receipt:", receipt);
      
      toast({
        title: "Transaction Confirmed",
        description: "Your funding transaction has been confirmed. Checking loan status...",
      });
      
      // Refresh loan data from blockchain
      const loanId = params.id as string
      const updatedLoanData = await getLoanDetails(loanId)
      setLoan(updatedLoanData)
      
      // Check if loan status is now active (fully funded)
      if (updatedLoanData.status === 1) { // 1 = Active
        toast({
          title: "Loan Successfully Funded",
          description: `Full amount of ${formatEther(updatedLoanData.amount)} MATIC has been transferred to borrower account ${updatedLoanData.borrower}`,
        });
      } else {
        toast({
          title: "Loan Funding In Progress",
          description: "Your contribution was processed, but the loan is not yet fully funded.",
        });
      }
    } catch (error) {
      console.error("Failed to fund loan:", error)
      toast({
        title: "Transaction Failed",
        description: "Failed to fund loan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRepay = async () => {
    if (!loan) return

    try {
      setProcessing(true)
      await repayLoan(loan.id)

      // Update the loan data
      setLoan((prev) => ({
        ...prev,
        status: "completed",
      }))

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
      setProcessing(false)
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

  const calculateTotalRepayment = () => {
    if (!loan) return 0
    return loan.amount * (1 + loan.interestRate / 100)
  }

  const getDaysLeft = () => {
    if (!loan || !loan.dueDate) return 0;
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = Number(loan.dueDate) - now;
    const daysLeft = Math.ceil(secondsLeft / (60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  }

  if (loading) {
    return (
      <ThemeProvider defaultTheme="dark" forcedTheme="dark">
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">MicroLend</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
                  Dashboard
                </Link>
                <Link href="/loans" className="text-sm font-medium hover:underline underline-offset-4">
                  Browse Loans
                </Link>
                <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4">
                  Create Loan
                </Link>
              </nav>
              <ConnectWallet />
            </div>
          </header>
          <main className="container px-4 md:px-6 py-8 md:py-12">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-xl mb-2">Loading loan details...</div>
              </div>
            </div>
          </main>
        </div>
      </ThemeProvider>
    )
  }

  if (!loan) {
    return (
      <ThemeProvider defaultTheme="dark" forcedTheme="dark">
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">MicroLend</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
                  Dashboard
                </Link>
                <Link href="/loans" className="text-sm font-medium hover:underline underline-offset-4">
                  Browse Loans
                </Link>
                <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4">
                  Create Loan
                </Link>
              </nav>
              <ConnectWallet />
            </div>
          </header>
          <main className="container px-4 md:px-6 py-8 md:py-12">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-xl mb-2">Loan not found</div>
                <Button onClick={() => router.push("/loans")}>Back to Loans</Button>
              </div>
            </div>
          </main>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">MicroLend</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
                Dashboard
              </Link>
              <Link href="/loans" className="text-sm font-medium hover:underline underline-offset-4">
                Browse Loans
              </Link>
              <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4">
                Create Loan
              </Link>
            </nav>
            <ConnectWallet />
          </div>
        </header>
        <main className="container px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push("/loans")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{loan.purpose}</h1>
                <p className="text-muted-foreground">Loan ID: {loan.id}</p>
              </div>
              <div className="ml-auto">
                <Badge className={getStatusColor(loan.status)}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Details</CardTitle>
                    <CardDescription>Created on {new Date(loan.createdAt * 1000).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground">Borrower</div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{formatAddress(loan.borrower)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{loan.amount} MATIC</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground">Interest Rate</div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span>{loan.interestRate}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{loan.duration} days</span>
                        </div>
                      </div>
                    </div>

                    {loan.status === "active" && (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground">Time Remaining</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{getDaysLeft()} days left</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Loan Description</div>
                      <p className="text-muted-foreground">{loan.description || loan.purpose}</p>
                    </div>

                    {loan.terms && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Terms & Conditions</div>
                        <p className="text-muted-foreground">{loan.terms}</p>
                      </div>
                    )}

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
                </Card>

                <div className="mt-6">
                  <Tabs defaultValue="schedule">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
                      <TabsTrigger value="activity">Loan Activity</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Repayment Schedule</CardTitle>
                          <CardDescription>Estimated repayment schedule for this loan</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <LoanRepaymentSchedule
                            amount={loan.amount}
                            interestRate={loan.interestRate}
                            duration={loan.duration}
                            startDate={loan.createdAt}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="activity" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Loan Activity</CardTitle>
                          <CardDescription>Recent activity for this loan</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <LoanActivity loanId={loan.id} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Principal</span>
                      <span>{loan.amount} MATIC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest ({loan.interestRate}%)</span>
                      <span>{((loan.amount * loan.interestRate) / 100).toFixed(2)} MATIC</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Repayment</span>
                      <span>{calculateTotalRepayment().toFixed(2)} MATIC</span>
                    </div>

                    {loan.status === "funding" && (
                      <>
                        <div className="flex justify-between">
                          <span>Funded So Far</span>
                          <span>{loan.funded} MATIC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining</span>
                          <span>{(loan.amount - loan.funded).toFixed(2)} MATIC</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    {loan.status === "funding" && (
                      <>
                        <div className="text-center text-amber-500 mb-2">
                          Full funding required. Partial funding is not allowed.
                        </div>
                        <Button className="w-full" onClick={handleFund} disabled={processing}>
                          {processing ? "Processing..." : `Fund Entire Loan (${loan.amount} MATIC)`}
                        </Button>
                      </>
                    )}

                    {loan.status === "active" && loan.isOwner && (
                      <Button className="w-full" onClick={handleRepay} disabled={processing}>
                        {processing ? "Processing..." : "Repay Loan"}
                      </Button>
                    )}

                    {loan.status === "completed" && (
                      <div className="text-center text-green-500 font-medium">This loan has been fully repaid</div>
                    )}

                    {loan.status === "defaulted" && (
                      <div className="text-center text-red-500 font-medium">This loan is in default</div>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

