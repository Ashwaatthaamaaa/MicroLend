"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"

export function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection()

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          getBalance(accounts[0])
        } else {
          setAccount(null)
          setBalance(null)
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(chainId)
        checkIfPolygon(chainId)
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners()
      }
    }
  }, [])

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          setAccount(accounts[0].address)
          getBalance(accounts[0].address)

          const network = await provider.getNetwork()
          setChainId(network.chainId.toString())
          checkIfPolygon(network.chainId.toString())
        }
      }
    } catch (error) {
      console.error("Failed to check connection:", error)
    }
  }

  const getBalance = async (address: string) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const balance = await provider.getBalance(address)
        setBalance(ethers.formatEther(balance))
      }
    } catch (error) {
      console.error("Failed to get balance:", error)
    }
  }

  const checkIfPolygon = (chainId: string) => {
    // Polygon Mainnet: 0x89, Mumbai Testnet: 0x13881
    if (chainId !== "0x89" && chainId !== "0x13881") {
      toast({
        title: "Wrong Network",
        description: "Please connect to Polygon network",
        variant: "destructive",
      })
    }
  }

  const connectWallet = async () => {
    try {
      setIsConnecting(true)

      if (!window.ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another Ethereum wallet",
          variant: "destructive",
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        setAccount(accounts[0])
        getBalance(accounts[0])

        const network = await provider.getNetwork()
        setChainId(network.chainId.toString())
        checkIfPolygon(network.chainId.toString())

        toast({
          title: "Wallet Connected",
          description: "Your wallet has been connected successfully",
        })
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setBalance(null)
    setChainId(null)

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const switchToPolygon = async () => {
    try {
      if (!window.ethereum) return

      // Try to switch to Polygon
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x89" }], // Polygon Mainnet
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x89",
                chainName: "Polygon Mainnet",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                rpcUrls: ["https://polygon-rpc.com/"],
                blockExplorerUrls: ["https://polygonscan.com/"],
              },
            ],
          })
        } else {
          throw switchError
        }
      }
    } catch (error) {
      console.error("Failed to switch network:", error)
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch to Polygon network",
        variant: "destructive",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!account) {
    return (
      <Button onClick={connectWallet} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{formatAddress(account)}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex justify-between">
          <span>Address:</span>
          <span className="text-xs">{formatAddress(account)}</span>
        </DropdownMenuItem>
        {balance && (
          <DropdownMenuItem className="flex justify-between">
            <span>Balance:</span>
            <span>{Number.parseFloat(balance).toFixed(4)} MATIC</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={switchToPolygon}>Switch to Polygon</DropdownMenuItem>
        <DropdownMenuItem onClick={disconnectWallet}>Disconnect</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

