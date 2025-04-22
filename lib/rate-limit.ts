import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT = 10 // requests
const RATE_LIMIT_WINDOW = 60 // seconds

const ipRequests = new Map<string, { count: number; timestamp: number }>()

export function rateLimit(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const now = Date.now()

  // Clean up old entries
  for (const [key, value] of ipRequests.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW * 1000) {
      ipRequests.delete(key)
    }
  }

  // Get current request count
  const current = ipRequests.get(ip)
  if (current) {
    if (now - current.timestamp > RATE_LIMIT_WINDOW * 1000) {
      // Reset if window has passed
      ipRequests.set(ip, { count: 1, timestamp: now })
    } else if (current.count >= RATE_LIMIT) {
      // Rate limit exceeded
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    } else {
      // Increment count
      current.count++
    }
  } else {
    // First request
    ipRequests.set(ip, { count: 1, timestamp: now })
  }

  return NextResponse.next()
} 