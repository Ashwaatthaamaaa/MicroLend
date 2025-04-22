import { z } from 'zod'

export const createLoanSchema = z.object({
  amount: z.number().positive(),
  purpose: z.string().min(1),
  description: z.string().optional(),
  durationDays: z.number().min(1).max(365),
  interestRate: z.number().min(1).max(20),
  collateralType: z.enum(['none', 'nft', 'token', 'other']),
  collateralAmount: z.number().optional(),
  terms: z.string().optional(),
})

export const fundLoanSchema = z.object({
  amount: z.number().positive(),
})

export type CreateLoanInput = z.infer<typeof createLoanSchema>
export type FundLoanInput = z.infer<typeof fundLoanSchema> 