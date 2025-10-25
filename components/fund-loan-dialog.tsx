"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface FundLoanDialogProps {
  loanId: string
  amount: number
  disabled?: boolean
  onFund: () => Promise<void>
}

export function FundLoanDialog({ loanId, amount, onFund, disabled }: FundLoanDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      await onFund()
      setIsOpen(false)
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Fund This Loan</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fund Loan</DialogTitle>
          <DialogDescription>
            This loan requires full funding of {amount} ETH. Partial funding is not allowed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              <p>Required funding amount: {amount} ETH</p>
              <p className="mt-2 text-amber-500">Note: You must fund the entire amount to proceed.</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Fund ${amount} ETH`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 