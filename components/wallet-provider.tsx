"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { onWalletChange, getConnectedAccount } from "@/frontend/lib/loan-contract"
import { useToast } from "@/hooks/use-toast"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  refreshData: () => void
  isRefreshing: boolean
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  refreshData: () => {},
  isRefreshing: false
})

export function useWallet() {
  return useContext(WalletContext)
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Function to refresh wallet connection status and data
  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      const account = await getConnectedAccount()
      setAddress(account)
      setIsConnected(!!account)
    } catch (error) {
      console.error("Failed to refresh wallet data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initial check for wallet connection
  useEffect(() => {
    refreshData()
  }, [])

  // Set up wallet change listener
  useEffect(() => {
    const unsubscribe = onWalletChange(async () => {
      // Get the new wallet address
      const newAddress = await getConnectedAccount()
      
      // Update state with new wallet info
      setAddress(newAddress)
      setIsConnected(!!newAddress)
      
      // Show toast notification
      toast({
        title: "Wallet Changed",
        description: newAddress 
          ? `Connected to ${newAddress.substring(0, 6)}...${newAddress.substring(newAddress.length - 4)}`
          : "Wallet disconnected",
      })
      
      // Trigger a refresh of the application data
      refreshData()
    })

    // Clean up the listener on unmount
    return () => {
      unsubscribe()
    }
  }, [toast])

  return (
    <WalletContext.Provider value={{ address, isConnected, refreshData, isRefreshing }}>
      {children}
    </WalletContext.Provider>
  )
} 