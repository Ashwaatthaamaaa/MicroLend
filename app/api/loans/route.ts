import { NextRequest, NextResponse } from 'next/server'

// Mock data for testing
const mockLoans = [
  {
    id: "1",
    borrower: "0x1234567890123456789012345678901234567890",
    amount: 100,
    purpose: "Business Expansion",
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    borrower: "0x1234567890123456789012345678901234567890",
    amount: 200,
    purpose: "Equipment Purchase",
    status: "funded",
    createdAt: new Date().toISOString()
  }
]

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const walletAddress = request.headers.get('x-wallet-address')
  
  // If wallet is connected, filter loans for that wallet
  const loans = walletAddress 
    ? mockLoans.filter(loan => loan.borrower.toLowerCase() === walletAddress.toLowerCase())
    : mockLoans

  return new NextResponse(JSON.stringify(loans), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
} 