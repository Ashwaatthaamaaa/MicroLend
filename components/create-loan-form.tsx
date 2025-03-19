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
import { createLoan } from "@/lib/loan-contract"

export function CreateLoanForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    amount: "",
    purpose: "",
    description: "",
    duration: "30",
    interestRate: 5,
    collateral: "none",
    collateralAmount: "",
    terms: "",
    agreeToTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, interestRate: value[0] }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      // Validate form
      if (!formData.amount || !formData.purpose || !formData.duration) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (!formData.agreeToTerms) {
        toast({
          title: "Terms Agreement Required",
          description: "You must agree to the terms and conditions",
          variant: "destructive",
        })
        return
      }

      // Convert amount to wei
      const amountInMatic = Number.parseFloat(formData.amount)
      if (isNaN(amountInMatic) || amountInMatic <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid loan amount",
          variant: "destructive",
        })
        return
      }

      // Create loan on blockchain
      const result = await createLoan({
        amount: amountInMatic,
        purpose: formData.purpose,
        description: formData.description,
        durationDays: Number.parseInt(formData.duration),
        interestRate: formData.interestRate,
        collateralType: formData.collateral,
        collateralAmount: formData.collateralAmount ? Number.parseFloat(formData.collateralAmount) : 0,
        terms: formData.terms,
      })

      toast({
        title: "Loan Created",
        description: "Your loan request has been created successfully",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to create loan:", error)
      toast({
        title: "Transaction Failed",
        description: "Failed to create loan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Details</CardTitle>
        <CardDescription>
          Provide the details of your loan request. Be clear about the purpose to increase your chances of funding.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Loan Amount (MATIC) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">Enter the amount you wish to borrow in MATIC</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Loan Purpose *</Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Brief purpose (e.g., Business Expansion)"
              value={formData.purpose}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">A clear title helps lenders understand your needs</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe why you need this loan and how you plan to use the funds..."
              value={formData.description}
              onChange={handleChange}
              required
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Provide details about your loan request to increase trust with potential lenders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration">Loan Duration *</Label>
              <Select value={formData.duration} onValueChange={(value) => handleSelectChange("duration", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collateral">Collateral (Optional)</Label>
              <Select value={formData.collateral} onValueChange={(value) => handleSelectChange("collateral", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collateral type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                  <SelectItem value="token">ERC-20 Token</SelectItem>
                  <SelectItem value="other">Other Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.collateral !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="collateralAmount">Collateral Amount/ID</Label>
              <Input
                id="collateralAmount"
                name="collateralAmount"
                placeholder={formData.collateral === "nft" ? "NFT ID" : "Amount"}
                value={formData.collateralAmount}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                {formData.collateral === "nft"
                  ? "Enter the ID of the NFT you're using as collateral"
                  : "Enter the amount of tokens you're using as collateral"}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Interest Rate: {formData.interestRate}%</Label>
              <Slider
                defaultValue={[5]}
                max={20}
                min={1}
                step={0.5}
                value={[formData.interestRate]}
                onValueChange={handleSliderChange}
              />
              <p className="text-sm text-muted-foreground">Higher interest rates may attract lenders more quickly</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
            <Textarea
              id="terms"
              name="terms"
              placeholder="Any specific terms or conditions for this loan..."
              value={formData.terms}
              onChange={handleChange}
              className="min-h-[80px]"
            />
            <p className="text-sm text-muted-foreground">Specify any additional terms or conditions for this loan</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="agreeToTerms" checked={formData.agreeToTerms} onCheckedChange={handleCheckboxChange} />
            <label
              htmlFor="agreeToTerms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the platform terms and conditions
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Loan..." : "Create Loan Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

