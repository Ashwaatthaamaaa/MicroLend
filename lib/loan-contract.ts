import { ethers } from "ethers"

// ABI for the MicroLend contract
const contractABI = [
  // Events
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 duration)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount)",
  "event RepaymentClaimed(uint256 indexed loanId, address indexed lender, uint256 amount)",

  // Read functions
  "function getLoanDetails(uint256 loanId) view returns (address borrower, uint256 amount, string purpose, uint256 interestRate, uint256 duration, uint256 funded, uint8 status, uint256 createdAt, uint256 dueDate)",
  "function getUserLoans(address borrower) view returns (uint256[] loanIds)",
  "function getUserInvestments(address lender) view returns (uint256[] loanIds)",
  "function getLenderInvestment(uint256 loanId, address lender) view returns (uint256 amount)",
  "function getPlatformStats() view returns (uint256 totalLoans, uint256 activeLoans, uint256 totalVolume, uint256 avgInterestRate)",
  "function getUserStats(address user) view returns (uint256 totalBorrowed, uint256 totalInvested, uint256 activeLoans, uint256 activeInvestments, uint256 reputation)",

  // Write functions
  "function createLoan(uint256 amount, string purpose, uint256 durationDays, uint256 interestRate) payable returns (uint256 loanId)",
  "function fundLoan(uint256 loanId) payable",
  "function repayLoan(uint256 loanId) payable",
  "function claimRepayment(uint256 loanId)",
]

// Contract address on Polygon
const contractAddress = "0x1234567890123456789012345678901234567890" // Replace with actual contract address

// Helper function to get contract instance
const getContract = async () => {
  if (!window.ethereum) {
    throw new Error("No Ethereum wallet found")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, contractABI, signer)
  } catch (error) {
    console.error("Error getting contract:", error)
    throw new Error(
      "Failed to connect to the contract. This is expected in the MVP as we're using a placeholder contract address.",
    )
  }
}

// Update the createLoan function to accept more parameters
export const createLoan = async ({
  amount,
  purpose,
  description,
  durationDays,
  interestRate,
  collateralType,
  collateralAmount,
  terms,
}: {
  amount: number
  purpose: string
  description?: string
  durationDays: number
  interestRate: number
  collateralType: string
  collateralAmount?: number
  terms?: string
}) => {
  try {
    // This would normally interact with the blockchain
    // For the MVP, we'll simulate a successful transaction

    console.log("Creating loan with the following details:", {
      amount,
      purpose,
      description,
      durationDays,
      interestRate,
      collateralType,
      collateralAmount,
      terms,
    })

    // Simulate a delay for the transaction
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      success: true,
      loanId: Math.floor(Math.random() * 1000).toString(),
    }
  } catch (error) {
    console.error("Error creating loan:", error)
    throw error
  }
}

// Fund a loan
export const fundLoan = async (loanId: string, amount: number) => {
  try {
    const contract = await getContract()

    // Convert amount to wei
    const amountInWei = ethers.parseEther(amount.toString())

    const tx = await contract.fundLoan(loanId, { value: amountInWei })
    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error funding loan:", error)
    throw error
  }
}

// Repay a loan
export const repayLoan = async (loanId: string) => {
  try {
    const contract = await getContract()

    // Get loan details to calculate repayment amount
    const loanDetails = await contract.getLoanDetails(loanId)
    const amount = loanDetails[1] // amount
    const interestRate = loanDetails[3] // interestRate

    // Calculate repayment amount (principal + interest)
    const interestAmount = (amount * interestRate) / 10000 // interestRate is in basis points
    const repaymentAmount = amount + interestAmount

    const tx = await contract.repayLoan(loanId, { value: repaymentAmount })
    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error repaying loan:", error)
    throw error
  }
}

// Claim repayment
export const claimRepayment = async (loanId: string) => {
  try {
    const contract = await getContract()

    const tx = await contract.claimRepayment(loanId)
    await tx.wait()
    return tx
  } catch (error) {
    console.error("Error claiming repayment:", error)
    throw error
  }
}

// Get platform statistics
export const getLoanStats = async () => {
  try {
    // For the MVP demo, return mock data instead of making contract calls
    return {
      totalLoans: 42,
      activeLoans: 18,
      totalVolume: 1250.75,
      avgInterestRate: 5.2,
    }
  } catch (error) {
    console.error("Error getting loan stats:", error)
    return {
      totalLoans: 42,
      activeLoans: 18,
      totalVolume: 1250.75,
      avgInterestRate: 5.2,
    }
  }
}

// Get user statistics
export const getUserStats = async () => {
  try {
    // Since we're using a mock contract address for the MVP,
    // we'll skip the actual contract call and return mock data

    // In a production environment with a deployed contract, you would use:
    // const contract = await getContract()
    // const provider = new ethers.BrowserProvider(window.ethereum)
    // const signer = await provider.getSigner()
    // const address = await signer.getAddress()
    // const stats = await contract.getUserStats(address)
    // return {
    //   totalBorrowed: Number(ethers.formatEther(stats[0])),
    //   totalInvested: Number(ethers.formatEther(stats[1])),
    //   activeLoans: Number(stats[2]),
    //   activeInvestments: Number(stats[3]),
    //   reputation: Number(stats[4])
    // }

    // For the MVP demo, return mock data
    return {
      totalBorrowed: 150.5,
      totalInvested: 320.75,
      activeLoans: 1,
      activeInvestments: 3,
      reputation: 85,
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    // Return mock data for demo purposes
    return {
      totalBorrowed: 150.5,
      totalInvested: 320.75,
      activeLoans: 1,
      activeInvestments: 3,
      reputation: 85,
    }
  }
}

// Get all loans
export const getLoans = async () => {
  try {
    // This would normally fetch from the blockchain
    // For demo purposes, we'll return mock data
    return [
      {
        id: "1",
        borrower: "0x1234567890123456789012345678901234567890",
        amount: 50,
        purpose: "Small business inventory",
        interestRate: 5,
        duration: 30,
        funded: 25,
        status: "funding",
        createdAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        id: "2",
        borrower: "0x2345678901234567890123456789012345678901",
        amount: 100,
        purpose: "Education expenses",
        interestRate: 4.5,
        duration: 60,
        funded: 100,
        status: "active",
        createdAt: Math.floor(Date.now() / 1000) - 172800,
      },
      {
        id: "3",
        borrower: "0x3456789012345678901234567890123456789012",
        amount: 75,
        purpose: "Medical expenses",
        interestRate: 3,
        duration: 90,
        funded: 75,
        status: "active",
        createdAt: Math.floor(Date.now() / 1000) - 259200,
      },
      {
        id: "4",
        borrower: "0x4567890123456789012345678901234567890123",
        amount: 200,
        purpose: "Home repairs",
        interestRate: 6,
        duration: 45,
        funded: 150,
        status: "funding",
        createdAt: Math.floor(Date.now() / 1000) - 43200,
      },
      {
        id: "5",
        borrower: "0x5678901234567890123456789012345678901234",
        amount: 30,
        purpose: "Agricultural supplies",
        interestRate: 5.5,
        duration: 30,
        funded: 30,
        status: "completed",
        createdAt: Math.floor(Date.now() / 1000) - 345600,
      },
    ]
  } catch (error) {
    console.error("Error getting loans:", error)
    return []
  }
}

// Get user loans
export const getUserLoans = async () => {
  try {
    // This would normally fetch from the blockchain
    // For demo purposes, we'll return mock data
    return [
      {
        id: "1",
        amount: 50,
        purpose: "Small business inventory",
        interestRate: 5,
        duration: 30,
        funded: 25,
        status: "funding",
        createdAt: Math.floor(Date.now() / 1000) - 86400,
        dueDate: 0,
      },
      {
        id: "6",
        amount: 80,
        purpose: "Purchase equipment",
        interestRate: 4,
        duration: 45,
        funded: 80,
        status: "active",
        createdAt: Math.floor(Date.now() / 1000) - 129600,
        dueDate: Math.floor(Date.now() / 1000) + 1296000,
      },
    ]
  } catch (error) {
    console.error("Error getting user loans:", error)
    return []
  }
}

// Get user investments
export const getUserInvestments = async () => {
  try {
    // This would normally fetch from the blockchain
    // For demo purposes, we'll return mock data
    return [
      {
        loanId: "2",
        borrower: "0x2345678901234567890123456789012345678901",
        amount: 100,
        purpose: "Education expenses",
        interestRate: 4.5,
        investedAmount: 25,
        status: "active",
        createdAt: Math.floor(Date.now() / 1000) - 172800,
        dueDate: Math.floor(Date.now() / 1000) + 2592000,
      },
      {
        loanId: "3",
        borrower: "0x3456789012345678901234567890123456789012",
        amount: 75,
        purpose: "Medical expenses",
        interestRate: 3,
        investedAmount: 15,
        status: "active",
        createdAt: Math.floor(Date.now() / 1000) - 259200,
        dueDate: Math.floor(Date.now() / 1000) + 3888000,
      },
      {
        loanId: "5",
        borrower: "0x5678901234567890123456789012345678901234",
        amount: 30,
        purpose: "Agricultural supplies",
        interestRate: 5.5,
        investedAmount: 10,
        status: "completed",
        createdAt: Math.floor(Date.now() / 1000) - 345600,
        dueDate: 0,
      },
    ]
  } catch (error) {
    console.error("Error getting user investments:", error)
    return []
  }
}

// Get detailed information about a specific loan
export const getLoanDetails = async (loanId: string) => {
  try {
    // In a real implementation, this would call the smart contract
    // For the MVP, we'll return mock data

    // Find the loan in our mock data
    const allLoans = await getLoans()
    const loan = allLoans.find((loan) => loan.id === loanId)

    if (!loan) {
      throw new Error("Loan not found")
    }

    // Add additional details for the detailed view
    return {
      ...loan,
      description:
        "This loan will be used to purchase inventory for my small business. I run a local craft shop selling handmade items, and I need to stock up for the upcoming holiday season. The funds will be used to purchase raw materials and supplies, allowing me to create more products and increase my sales during this busy period.",
      terms: "Repayment will be made in full at the end of the loan term. Early repayment is allowed without penalty.",
      isOwner: loan.id === "1" || loan.id === "6", // Mock ownership for demo
      dueDate: loan.status === "active" ? Math.floor(Date.now() / 1000) + 1296000 : 0,
    }
  } catch (error) {
    console.error("Error getting loan details:", error)
    throw error
  }
}

// Get activity history for a specific loan
export const getLoanActivity = async (loanId: string) => {
  try {
    // In a real implementation, this would fetch events from the blockchain
    // For the MVP, we'll return mock data

    const now = Math.floor(Date.now() / 1000)

    // Generate mock activity based on the loan ID
    return [
      {
        type: "created",
        timestamp: now - 86400 * 3,
        user: "0x1234567890123456789012345678901234567890",
      },
      {
        type: "funded",
        timestamp: now - 86400 * 2,
        user: "0x2345678901234567890123456789012345678901",
        amount: 10,
      },
      {
        type: "funded",
        timestamp: now - 86400,
        user: "0x3456789012345678901234567890123456789012",
        amount: 15,
      },
    ]
  } catch (error) {
    console.error("Error getting loan activity:", error)
    return []
  }
}

