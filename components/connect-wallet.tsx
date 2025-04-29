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
  const [networkName, setNetworkName] = useState<string>("Unknown Network")
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case "0xaa36a7": // 11155111
        return "Sepolia"
      case "0x1":
        return "Ethereum Mainnet"
      case "0x5":
        return "Goerli"
      default:
        return "Unknown Network"
    }
  }

  const isCorrectNetwork = (chainId: string) => chainId === "0xaa36a7"

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
        setNetworkName(getNetworkName(chainId))
        checkNetwork(chainId)
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
          const chainIdString = network.chainId.toString(16)
          const formattedChainId = `0x${chainIdString}`
          setChainId(formattedChainId)
          setNetworkName(getNetworkName(formattedChainId))
          checkNetwork(formattedChainId)
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

  const checkNetwork = (chainId: string) => {
    // Sepolia chainId: 0xaa36a7 (11155111 in decimal)
    if (chainId !== "0xaa36a7") {
      toast({
        title: "Wrong Network",
        description: "Please connect to Sepolia test network",
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
        const chainIdString = network.chainId.toString(16)
        const formattedChainId = `0x${chainIdString}`
        setChainId(formattedChainId)
        setNetworkName(getNetworkName(formattedChainId))
        checkNetwork(formattedChainId)

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

  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) return

      // Try to switch to Sepolia
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // Sepolia testnet
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "SepoliaETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
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
        description: "Failed to switch to Sepolia network",
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
        <Button variant="outline" className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCorrectNetwork(chainId || "") ? "bg-green-500" : "bg-red-500"}`} />
          {formatAddress(account)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex justify-between">
          <span>Address:</span>
          <span className="text-xs">{formatAddress(account)}</span>
        </DropdownMenuItem>
        {balance && (
          <DropdownMenuItem className="flex justify-between">
            <span>Balance:</span>
            <span>{Number.parseFloat(balance).toFixed(4)} ETH</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="flex justify-between">
          <span>Network:</span>
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCorrectNetwork(chainId || "") ? "bg-green-500" : "bg-red-500"}`} />
            {networkName}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isCorrectNetwork(chainId || "") && (
          <DropdownMenuItem onClick={switchToSepolia} className="text-blue-500 cursor-pointer">
            Switch to Sepolia
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={disconnectWallet} className="text-red-500 cursor-pointer">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

