"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { getLoanActivity } from "@/lib/loan-contract"

interface LoanActivityProps {
  loanId: string
}

interface ActivityItem {
  type: string
  timestamp: number
  user: string
  amount?: number
}

export function LoanActivity({ loanId }: LoanActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true)
        const data = await getLoanActivity(loanId)
        setActivities(data)
      } catch (error) {
        console.error("Failed to fetch loan activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [loanId])

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return "🆕"
      case "funded":
        return "💰"
      case "repaid":
        return "✅"
      case "defaulted":
        return "⚠️"
      default:
        return "📝"
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "created":
        return `Loan created by ${formatAddress(activity.user)}`
      case "funded":
        return `${formatAddress(activity.user)} funded ${activity.amount} MATIC`
      case "repaid":
        return `Loan repaid by ${formatAddress(activity.user)}`
      case "defaulted":
        return `Loan marked as defaulted`
      default:
        return `Unknown activity`
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading activity...</div>
  }

  if (activities.length === 0) {
    return <div className="text-center py-4">No activity recorded for this loan</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
          <div className="text-2xl">{getActivityIcon(activity.type)}</div>
          <div className="flex-1">
            <p>{getActivityText(activity)}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(activity.timestamp * 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

