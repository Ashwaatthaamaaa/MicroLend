"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LoanRepaymentScheduleProps {
  amount: number
  interestRate: number
  duration: number
  startDate: number
}

export function LoanRepaymentSchedule({ amount, interestRate, duration, startDate }: LoanRepaymentScheduleProps) {
  // Calculate repayment schedule
  const totalInterest = amount * (interestRate / 100)
  const totalRepayment = amount + totalInterest

  // For simplicity, we'll create a single payment at the end of the term
  // In a real application, you might want to calculate amortization schedule
  const dueDate = new Date((startDate + duration * 24 * 60 * 60) * 1000)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payment #</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Principal</TableHead>
          <TableHead>Interest</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>1</TableCell>
          <TableCell>{dueDate.toLocaleDateString()}</TableCell>
          <TableCell>{amount.toFixed(2)} ETH</TableCell>
          <TableCell>{totalInterest.toFixed(2)} ETH</TableCell>
          <TableCell>{totalRepayment.toFixed(2)} ETH</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

