"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createLoan, getConnectedAccount } from "@/frontend/lib/loan-contract"
import { parseEther } from "ethers"

export function CreateLoanForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [formData, setFormData] = useState({
    amount: "",
    purpose: "",
    duration: "30",
    interestRate: 500, // 5% in basis points
    agreeToTerms: false,
  })

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = "Amount is required"
    } else {
      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Please enter a valid positive amount"
      } else if (amount > 100) {
        newErrors.amount = "Maximum loan amount is 100 ETH"
      } 
      // Validate that amount has max 18 decimal places (ETH precision)
      try {
        parseEther(formData.amount)
      } catch (e) {
        newErrors.amount = "Invalid ETH amount precision"
      }
    }

    // Purpose validation
    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required"
    } else if (formData.purpose.length < 10) {
      newErrors.purpose = "Purpose must be at least 10 characters"
    } else if (formData.purpose.length > 100) {
      newErrors.purpose = "Purpose must not exceed 100 characters"
    }

    // Duration validation
    if (!formData.duration) {
      newErrors.duration = "Duration is required"
    }

    // Interest rate validation
    if (formData.interestRate < 100) { // 1%
      newErrors.interestRate = "Minimum interest rate is 1%"
    } else if (formData.interestRate > 2000) { // 20%
      newErrors.interestRate = "Maximum interest rate is 20%"
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, interestRate: value[0] * 100 })) // Convert percentage to basis points
    if (errors.interestRate) {
      setErrors((prev) => ({ ...prev, interestRate: "" }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
    if (errors.terms) {
      setErrors((prev) => ({ ...prev, terms: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate form
      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Check wallet connection
      const account = await getConnectedAccount()
      if (!account) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to create a loan request",
          variant: "destructive",
        })
        return
      }

      // Create loan on blockchain
      const tx = await createLoan(
        formData.amount, // Amount in ETH
        formData.interestRate, // Interest rate in basis points
        Number.parseInt(formData.duration), // Duration in days
        formData.purpose // Loan purpose
      )

      toast({
        title: "Loan Request Created",
        description: (
          <div className="mt-2">
            <p>Your loan request has been submitted to the blockchain.</p>
            <p className="mt-2 font-mono text-xs">
              Transaction: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
            </p>
            <p className="mt-2 text-sm">Redirecting to dashboard in 2 seconds...</p>
          </div>
        ),
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (error: any) {
      console.error("Failed to create loan:", error)
      
      // Handle specific error cases
      let errorMessage = "Failed to create loan. Please try again."
      if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected in your wallet"
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees"
      } else if (error.message.includes("network")) {
        errorMessage = "Please make sure you're connected to Sepolia network"
      }

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Loan Request</CardTitle>
        <CardDescription>
          Specify your loan requirements. All amounts are in ETH on the Sepolia testnet.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className={errors.amount ? "text-red-500" : ""}>
              Loan Amount (ETH) *
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              max="100"
              value={formData.amount}
              onChange={handleChange}
              required
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount ? (
              <p className="text-sm text-red-500">{errors.amount}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Enter the amount you wish to borrow (0.01 - 100 ETH)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose" className={errors.purpose ? "text-red-500" : ""}>
              Loan Purpose *
            </Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Brief purpose (e.g., Business Expansion)"
              value={formData.purpose}
              onChange={handleChange}
              required
              className={errors.purpose ? "border-red-500" : ""}
            />
            {errors.purpose ? (
              <p className="text-sm text-red-500">{errors.purpose}</p>
            ) : (
              <p className="text-sm text-muted-foreground">10-100 characters describing your loan purpose</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className={errors.duration ? "text-red-500" : ""}>
                Loan Duration *
              </Label>
              <Select value={formData.duration} onValueChange={(value) => handleSelectChange("duration", value)}>
                <SelectTrigger className={errors.duration ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
            </div>

            <div className="space-y-2">
              <Label className={errors.interestRate ? "text-red-500" : ""}>Interest Rate (%) *</Label>
              <div className="pt-2">
                <Slider
                  defaultValue={[5]}
                  max={20}
                  min={1}
                  step={0.5}
                  value={[formData.interestRate / 100]}
                  onValueChange={handleSliderChange}
                  className={errors.interestRate ? "border-red-500" : ""}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">1%</span>
                  <span className={errors.interestRate ? "text-red-500" : "text-muted-foreground"}>
                    {formData.interestRate / 100}% APR
                  </span>
                  <span className="text-muted-foreground">20%</span>
                </div>
              </div>
              {errors.interestRate && <p className="text-sm text-red-500">{errors.interestRate}</p>}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={handleCheckboxChange}
              className={errors.terms ? "border-red-500" : ""}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className={`text-sm font-medium leading-none ${
                  errors.terms ? "text-red-500" : ""
                } peer-disabled:cursor-not-allowed peer-disabled:opacity-70`}
              >
                I agree to the terms and conditions
              </label>
              {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <span className="animate-pulse">Creating Loan Request...</span>
              </>
            ) : (
              "Create Loan Request"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

