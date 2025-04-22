"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

interface Loan {
  id: string
  borrower: string
  amount: number
  purpose: string
  status: 'pending' | 'funded' | 'repaid' | 'cancelled'
  createdAt: string
}

export default function Loans() {
  const { address, isConnected } = useAccount()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const headers: HeadersInit = {}
        if (isConnected && address) {
          headers['x-wallet-address'] = address
        }

        const response = await fetch('/api/loans', {
          headers
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch loans')
        }
        
        const data = await response.json()
        setLoans(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLoans()
  }, [isConnected, address])

  const handleLoanAction = async (action: 'fund' | 'repay' | 'cancel', loanId: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    try {
      const response = await fetch(`/api/loans/${loanId}/${action}`, {
        method: 'POST',
        headers: {
          'x-wallet-address': address
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} loan`)
      }

      const updatedLoan = await response.json()
      setLoans(loans.map(loan => 
        loan.id === updatedLoan.id ? updatedLoan : loan
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Loans</h2>
      {!isConnected && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Please connect your wallet to interact with loans
        </div>
      )}
      <div className="grid gap-4">
        {loans.map((loan) => (
          <div key={loan.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">Loan #{loan.id}</h3>
            <p>Amount: {loan.amount}</p>
            <p>Purpose: {loan.purpose}</p>
            <p>Status: {loan.status}</p>
            <p>Created: {new Date(loan.createdAt).toLocaleDateString()}</p>
            {isConnected && (
              <div className="mt-4 space-x-2">
                {loan.status === 'pending' && (
                  <button
                    onClick={() => handleLoanAction('fund', loan.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Fund
                  </button>
                )}
                {loan.status === 'funded' && (
                  <button
                    onClick={() => handleLoanAction('repay', loan.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Repay
                  </button>
                )}
                {loan.status === 'pending' && (
                  <button
                    onClick={() => handleLoanAction('cancel', loan.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 