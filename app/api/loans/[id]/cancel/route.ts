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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const loan = mockLoans.find(l => l.id === params.id)
  
  if (!loan) {
    return new NextResponse(JSON.stringify({ error: 'Loan not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (loan.status !== 'pending') {
    return new NextResponse(JSON.stringify({ error: 'Only pending loans can be cancelled' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // In a real implementation, we would update the database
  loan.status = 'cancelled'

  return new NextResponse(JSON.stringify(loan), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
} 