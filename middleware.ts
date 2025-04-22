import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createLoanSchema, fundLoanSchema } from '@/lib/validation/loan'
import { rateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip middleware for public API routes
  if (request.nextUrl.pathname === '/api/loans') {
    return NextResponse.next()
  }

  // Apply rate limiting
  const rateLimitResponse = rateLimit(request)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }

  // Check for wallet address in headers
  const walletAddress = request.headers.get('x-wallet-address')
  
  if (!walletAddress) {
    return new NextResponse(
      JSON.stringify({ error: 'Wallet not connected' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Validate request body for POST requests
  if (request.method === 'POST') {
    try {
      const body = await request.json()
      
      // Validate based on endpoint
      if (request.nextUrl.pathname.includes('/fund')) {
        fundLoanSchema.parse(body)
      } else if (request.nextUrl.pathname === '/api/loans') {
        createLoanSchema.parse(body)
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 