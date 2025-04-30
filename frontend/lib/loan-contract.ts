// frontend/lib/loan-contract.ts
import { ethers, BrowserProvider, Contract, Signer, parseEther, formatEther, ContractTransactionResponse, ZeroAddress } from 'ethers'; // Use ethers v6+ imports

// Import types for the contract artifacts
interface ContractArtifact {
    abi: any[];
    bytecode: string;
}

interface ContractAddress {
    address: string;
}

// Import contract artifacts
import contractArtifact from './contracts/MicroLend.json';
import addressFile from './contracts/contract-address.json';

// Type assertions
const artifact = contractArtifact as ContractArtifact;
const addressInfo = addressFile as ContractAddress;

const contractAddress = addressInfo.address || ZeroAddress; // Use ZeroAddress if not found
const contractABI = artifact.abi;
const SEPOLIA_CHAIN_ID = BigInt(11155111); // Sepolia Chain ID as BigInt

// Type definition for the Loan struct matching the Solidity contract
export interface Loan {
  id: bigint;
  borrower: string;
  amount: bigint; // Wei
  interestRate: bigint; // Basis points
  duration: bigint; // Seconds
  purpose: string;
  status: number; // 0: Funding, 1: Active
  amountFunded: bigint; // Wei
  createdAt: bigint; // Unix timestamp (seconds)
  dueDate: bigint; // Unix timestamp (seconds)
}

let provider: BrowserProvider | null = null;
let signer: Signer | null = null;
let contract: Contract | null = null;
let isInitializing = false; // Flag to prevent race conditions during init

// Add new wallet change detection functionality
let walletChangeListeners: (() => void)[] = [];

/**
 * Registers a callback to be executed when the wallet changes
 * @param listener Function to call when wallet changes
 * @returns Function to unregister the listener
 */
export function onWalletChange(listener: () => void): () => void {
  walletChangeListeners.push(listener);
  
  // Return a function to remove this listener
  return () => {
    walletChangeListeners = walletChangeListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all registered listeners about a wallet change
 */
function notifyWalletChanged() {
  walletChangeListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in wallet change listener:', error);
    }
  });
}

/**
 * Setup wallet change detection
 */
function setupWalletChangeDetection() {
  if (typeof window !== 'undefined' && window.ethereum) {
    // Remove any existing listeners to prevent duplicates
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    
    // Add listeners with named functions to allow removal
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    console.log('Wallet change detection set up');
  }
}

// Handle account changes from MetaMask
function handleAccountsChanged(accounts: string[]) {
  console.log('Wallet accounts changed:', accounts);
  
  // Reset state on disconnect
  if (accounts.length === 0) {
    provider = null;
    signer = null;
    contract = null;
    console.log('Wallet disconnected');
  }
  
  // Always notify listeners, even if we're going to reinitialize
  notifyWalletChanged();
  
  // Reinitialize if we have accounts
  if (accounts.length > 0 && provider) {
    initEthers()
      .then(() => {
        console.log('Reinitialized after account change');
      })
      .catch(error => {
        console.error('Failed to reinitialize after wallet change:', error);
      });
  }
}

// Handle chain changes from MetaMask
function handleChainChanged(chainId: string) {
  console.log('Wallet network changed:', chainId);
  
  // MetaMask recommends reloading the page on chain change
  window.location.reload();
}

// Modified initEthers to setup wallet change detection
async function initEthers() {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask and reload.");
    }

    // Request accounts to ensure permission
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create a new provider and signer
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    
    // Create contract instance
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    // Setup wallet change detection (only once)
    setupWalletChangeDetection();
    
    // Log connection success
    const address = await signer.getAddress();
    console.log(`Connected to wallet: ${address}`);
    
    return { provider, signer, contract };
  } catch (error: any) {
    // Reset state on failure
    provider = null;
    signer = null;
    contract = null;
    
    console.error("Failed to initialize Ethers:", error.message || error);
    throw error;
  }
}

// Ensure ethers is initialized and connected to Sepolia
async function ensureInitialized() {
    if (!provider || !signer || !contract) {
         if (isInitializing) {
            // Wait a moment if initialization is already in progress
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!provider || !signer || !contract) { // Check again after wait
                throw new Error("Ethers initialization is still in progress or failed.");
            }
         } else {
             // Attempt initialization if not already started
            await initEthers();
         }
    }
    // This check runs AFTER initialization is confirmed successful
    if (!provider) {
        throw new Error("Ethers provider could not be initialized.");
    }

    // Check if connected to the correct network (Sepolia)
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
        console.warn(`Connected to wrong network: ${network.name} (${network.chainId}). Please switch to Sepolia (Chain ID: ${SEPOLIA_CHAIN_ID}).`);
        // Attempt to switch network automatically (optional)
        /* try {
            await window.ethereum?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }], // chainId must be in hex format
            });
             // Re-check network after switch attempt
             const newNetwork = await provider.getNetwork();
             if (newNetwork.chainId !== SEPOLIA_CHAIN_ID) {
                 throw new Error(`Please switch your wallet to the Sepolia test network (Chain ID: ${SEPOLIA_CHAIN_ID}).`);
             }
        } catch (switchError: any) {
            // Handle errors, e.g., user rejects switch or chain not added to MetaMask
            console.error("Failed to switch network:", switchError);
            throw new Error(`Please switch your wallet to the Sepolia test network (Chain ID: ${SEPOLIA_CHAIN_ID}). Error: ${switchError.message}`);
        } */
        // For now, just throw error if not on Sepolia
         throw new Error(`Please switch your wallet to the Sepolia test network (Chain ID: ${SEPOLIA_CHAIN_ID}).`);
    }
     // If we got here, we are initialized and on the correct network
}


// --- MVP Contract Interactions ---

/**
 * Creates a new loan request on the blockchain.
 * @param amount Loan amount in ETH string (e.g., "0.1").
 * @param interestRate Annual interest rate in basis points (e.g., 500 for 5%).
 * @param durationDays Loan duration in days.
 * @param purpose Description of the loan's purpose.
 * @returns The transaction response object.
 */
export async function createLoan(amount: string, interestRate: number, durationDays: number, purpose: string): Promise<ContractTransactionResponse> {
  await ensureInitialized(); // Ensures wallet connected and on Sepolia
  if (!contract) throw new Error("Contract not initialized.");

  try {
    const amountInWei = parseEther(amount);
    console.log(`Attempting to create loan: Amount=${amount} ETH (${amountInWei} Wei), Rate=${interestRate} bps, Duration=${durationDays} days`);

    // Convert numeric inputs to BigInt for the contract call
    const tx = await contract.createLoan(
      amountInWei,
      BigInt(interestRate),
      BigInt(durationDays),
      purpose
    );
    console.log("Create loan transaction submitted:", tx.hash);
    return tx; // Return the transaction response
  } catch (error: any) {
    console.error("Error creating loan:", error.message || error);
    // Consider parsing specific contract errors if needed
    throw error; // Re-throw for handling in the UI layer
  }
}

/**
 * Funds an existing loan request. Will fund the ENTIRE requested amount.
 * @param loanId The ID of the loan to fund (string or number).
 * @returns The transaction response object.
 * @throws {Error} If trying to self-fund or other contract errors
 */
export async function fundLoan(loanId: number | string): Promise<ContractTransactionResponse> {
    await ensureInitialized(); // Ensures wallet connected and on Sepolia
    if (!contract) throw new Error("Contract not initialized.");
    if (!signer) throw new Error("Wallet not connected.");

    try {
        // Get loan details first to check the borrower and required amount
        const loan = await getLoanDetails(loanId);
        if (!loan) {
            throw new Error("Loan not found");
        }

        // Get current wallet address
        const currentAddress = await signer.getAddress();
        
        // Check if trying to self-fund
        if (loan.borrower.toLowerCase() === currentAddress.toLowerCase()) {
            throw new Error("You cannot fund your own loan request");
        }

        // Check if loan is already fully funded
        if (loan.amountFunded >= loan.amount) {
            throw new Error("This loan is already fully funded");
        }

        // IMPORTANT: Use the FULL loan amount, not just the remaining amount
        // The contract expects to receive the full amount and will handle partial funding internally
        const fullAmount = loan.amount;
        const loanIdBigInt = BigInt(loanId);
        
        console.log(`Funding loan ${loanIdBigInt}: Full amount=${formatEther(fullAmount)} ETH`);
        console.log(`Borrower address: ${loan.borrower}`);

        // Send the FULL loan amount
        const tx = await contract.fundLoan(
            loanIdBigInt,
            { 
                value: fullAmount, // Send the FULL amount
                gasLimit: 300000 // Set a higher gas limit to ensure transaction completes
            }
        );
        
        console.log("Fund loan transaction submitted:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed! Receipt:", receipt);
        
        // Verify the loan is now fully funded and status is Active
        const updatedLoan = await getLoanDetails(loanId);
        if (!updatedLoan) {
            throw new Error("Failed to fetch updated loan details after funding");
        }
        
        console.log(`Updated loan status: ${updatedLoan.status === 1 ? "Active" : "Funding"}`);
        console.log(`Funded amount: ${formatEther(updatedLoan.amountFunded)} ETH / ${formatEther(updatedLoan.amount)} ETH`);
        
        if (updatedLoan.status === 1) { // 1 = LoanStatus.Active
            console.log(`✅ Loan fully funded! Funds should be transferred to borrower ${loan.borrower}`);
        } else {
            console.log(`⚠️ Loan funded but status is not Active. Borrower hasn't received funds yet.`);
        }
        
        return tx;
    } catch (error: any) {
        console.error(`Error funding loan ${loanId}:`, error.message || error);
        throw error; // Re-throw for UI handling
    }
}

/**
 * Retrieves the details of a specific loan using a read-only provider.
 * @param loanId The ID of the loan (string or number).
 * @returns A promise resolving to the Loan object, or null if initialization fails. Throws on contract error (e.g., LoanNotFound).
 */
export async function getLoanDetails(loanId: number | string): Promise<Loan | null> {
    // Use a read-only instance if provider is available, otherwise try to init
     let readProvider = provider;
     if (!readProvider) {
        try {
            // Attempt a lightweight init just for provider if needed for read-only calls
            if (typeof window !== 'undefined' && window.ethereum) {
                readProvider = new ethers.BrowserProvider(window.ethereum);
            } else {
                 console.warn("MetaMask not detected for read operation.");
                 return null; // Cannot proceed without a provider
            }
        } catch (initError: any) {
            console.error("Failed to initialize provider for read operation:", initError.message);
            return null;
        }
     }

    // Check if contract address is valid
    if (!contractAddress || contractAddress === ZeroAddress) {
         console.error("Contract address is not configured correctly for read operation.");
         return null;
    }

    const readContract = new ethers.Contract(contractAddress, contractABI, readProvider);
    const loanIdBigInt = BigInt(loanId);

    try {
        console.log(`Fetching details for loan ${loanIdBigInt}...`);
        // Call the contract's view function
        const loanData = await readContract.getLoanDetails(loanIdBigInt);

        // Map the returned data (which might be an array or object) to the Loan interface
        const loan: Loan = {
            id: BigInt(loanData.id ?? loanData[0]),
            borrower: String(loanData.borrower ?? loanData[1]),
            amount: BigInt(loanData.amount ?? loanData[2]),
            interestRate: BigInt(loanData.interestRate ?? loanData[3]),
            duration: BigInt(loanData.duration ?? loanData[4]),
            purpose: String(loanData.purpose ?? loanData[5]),
            status: Number(loanData.status ?? loanData[6]), // Convert enum BigInt to number
            amountFunded: BigInt(loanData.amountFunded ?? loanData[7]),
            createdAt: BigInt(loanData.createdAt ?? loanData[8]),
            dueDate: BigInt(loanData.dueDate ?? loanData[9]),
        };
        console.log(`Details received for loan ${loanIdBigInt}`);
        return loan;
    } catch (error: any) {
        console.error(`Error fetching details for loan ${loanId}:`, error.message || error);
        // Let the caller handle specific contract errors (like LoanNotFound)
        throw error;
    }
}

/**
 * Retrieves a list of all loan IDs using a read-only provider.
 * @returns A promise resolving to an array of loan IDs (as strings). Returns empty array on failure.
 */
export async function getAllLoanIds(): Promise<string[]> {
     let readProvider = provider;
     if (!readProvider) {
        try {
            if (typeof window !== 'undefined' && window.ethereum) {
                readProvider = new ethers.BrowserProvider(window.ethereum);
            } else {
                 console.warn("MetaMask not detected for read operation.");
                 return [];
            }
        } catch (initError: any) {
            console.error("Failed to initialize provider for read operation:", initError.message);
            return [];
        }
     }

     if (!contractAddress || contractAddress === ZeroAddress) {
         console.error("Contract address is not configured correctly for read operation.");
         return [];
     }

     const readContract = new ethers.Contract(contractAddress, contractABI, readProvider);

    try {
        console.log("Fetching all loan IDs...");
        const loanIdsBigInt: bigint[] = await readContract.getAllLoanIds();
        const loanIds = loanIdsBigInt.map(id => id.toString()); // Convert BigInt[] to string[]
        console.log(`Found ${loanIds.length} loan IDs.`);
        return loanIds;
    } catch (error: any) {
        console.error("Error fetching all loan IDs:", error.message || error);
        return []; // Return empty array on error
    }
}

 /**
  * Retrieves the amount invested by a specific lender in a specific loan using a read-only provider.
  * @param loanId The ID of the loan (string or number).
  * @param lenderAddress The address of the lender.
  * @returns A promise resolving to the amount invested in Wei (as bigint). Returns 0n on failure.
  */
export async function getLenderInvestment(loanId: number | string, lenderAddress: string): Promise<bigint> {
    let readProvider = provider;
     if (!readProvider) {
        try {
            if (typeof window !== 'undefined' && window.ethereum) {
                readProvider = new ethers.BrowserProvider(window.ethereum);
            } else {
                 console.warn("MetaMask not detected for read operation.");
                 return 0n;
            }
        } catch (initError: any) {
            console.error("Failed to initialize provider for read operation:", initError.message);
            return 0n;
        }
     }

     if (!contractAddress || contractAddress === ZeroAddress) {
         console.error("Contract address is not configured correctly for read operation.");
         return 0n;
     }

     const readContract = new ethers.Contract(contractAddress, contractABI, readProvider);
     const loanIdBigInt = BigInt(loanId);

    try {
        console.log(`Fetching investment for lender ${lenderAddress} in loan ${loanIdBigInt}...`);
        const investmentAmount: bigint = await readContract.getLenderInvestment(loanIdBigInt, lenderAddress);
        console.log(`Investment amount for lender ${lenderAddress} in loan ${loanIdBigInt}: ${formatEther(investmentAmount)} ETH`);
        return investmentAmount;
    } catch (error: any) {
        console.error(`Error fetching investment for lender ${lenderAddress} in loan ${loanId}:`, error.message || error);
        return 0n; // Return 0 BigInt on error
    }
}

/**
 * Retrieves all loans from the contract.
 * @returns A promise resolving to an array of formatted loan objects for the UI.
 * @throws {Error} If there's an issue with provider initialization or contract interaction
 */
export async function getLoans(): Promise<{
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  interestRate: number;
  duration: number;
  funded: number;
  status: "funding" | "active" | "completed" | "defaulted";
  createdAt: number;
  dueDate: number;
}[]> {
  try {
    // Ensure we have a provider for read operations
    let readProvider = provider;
    if (!readProvider) {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No provider available. Please ensure MetaMask is installed and accessible.");
      }
      try {
        readProvider = new ethers.BrowserProvider(window.ethereum);
      } catch (providerError: any) {
        throw new Error(`Failed to initialize provider: ${providerError.message || 'Unknown provider error'}`);
      }
    }

    // Get all loan IDs
    const loanIds = await getAllLoanIds();
    if (!loanIds.length) {
      console.log("No loans found in the contract");
      return [];
    }
    
    // Fetch details for each loan with individual error handling
    const loanPromises = loanIds.map(async (id) => {
      try {
        const loan = await getLoanDetails(id);
        if (!loan) {
          console.warn(`Loan ${id} details could not be fetched`);
          return null;
        }

        // Convert status number to string with validation
        let status: "funding" | "active" | "completed" | "defaulted";
        switch (loan.status) {
          case 0:
            status = "funding";
            break;
          case 1:
            status = "active";
            break;
          case 2:
            status = "completed";
            break;
          case 3:
            status = "defaulted";
            break;
          default:
            console.warn(`Unknown loan status ${loan.status} for loan ${id}`);
            status = "funding"; // Default to funding if unknown
        }

        // Safely convert numeric values with validation
        try {
          const amount = Number(formatEther(loan.amount));
          const funded = Number(formatEther(loan.amountFunded));
          const interestRate = Number(loan.interestRate) / 100;
          const duration = Number(loan.duration) / 86400;
          const createdAt = Number(loan.createdAt);
          const dueDate = Number(loan.dueDate);

          // Validate converted values
          if (isNaN(amount) || isNaN(funded) || isNaN(interestRate) || 
              isNaN(duration) || isNaN(createdAt) || isNaN(dueDate)) {
            throw new Error("Invalid numeric conversion");
          }

          return {
            id: loan.id.toString(),
            borrower: loan.borrower,
            amount, // Convert Wei to ETH
            purpose: loan.purpose,
            interestRate, // Convert basis points to percentage
            duration, // Convert seconds to days
            funded, // Convert Wei to ETH
            status,
            createdAt,
            dueDate
          };
        } catch (conversionError: any) {
          console.error(`Error converting loan ${id} values:`, conversionError);
          return null;
        }
      } catch (loanError: any) {
        console.error(`Error processing loan ${id}:`, loanError.message || loanError);
        return null;
      }
    });

    // Wait for all loan details to be fetched
    const loans = await Promise.all(loanPromises);
    
    // Filter out any null values and sort by creation time (newest first)
    const validLoans = loans
      .filter((loan): loan is NonNullable<typeof loan> => loan !== null)
      .sort((a, b) => b.createdAt - a.createdAt);

    console.log(`Successfully fetched ${validLoans.length} valid loans out of ${loanIds.length} total loans`);
    return validLoans;

  } catch (error: any) {
    // Handle specific error types
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error: Please check your internet connection');
    } else if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed: The smart contract may be unavailable');
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Contract interaction error: Please try again later');
    }

    // Log the full error for debugging but return a user-friendly message
    console.error("Error fetching all loans:", error);
    throw new Error(`Failed to fetch loans: ${error.message || 'Unknown error occurred'}`);
  }
}

// --- Utility Functions ---

/**
 * Gets the currently connected wallet address.
 * @returns A promise resolving to the address string, or null if not connected/initialized.
 */
export async function getConnectedAccount(): Promise<string | null> {
    if (!signer) {
        try {
            // Attempt initialization if needed, but don't throw if it fails here
            await initEthers();
        } catch {
             // Ignore initialization error for this read-only type function
        }
    }
    // Check again after attempting init
    return signer ? signer.getAddress() : null;
}

/**
 * Explicitly initiates the connection to the user's wallet (e.g., called by a "Connect Wallet" button).
 * @returns A promise that resolves when initialization is complete, or rejects on error.
 */
export async function connectWallet(): Promise<void> {
     // Ensure initialization is attempted, and let it throw errors for the UI to catch
     await initEthers();
     // Check network after successful connection
     await ensureInitialized();
}

/**
 * Retrieves all loans created by the current user.
 * @returns A promise resolving to an array of the user's loan requests.
 * @throws {Error} If there's an issue with provider initialization or contract interaction
 */
export async function getUserLoans(): Promise<{
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  interestRate: number;
  duration: number;
  funded: number;
  status: "funding" | "active" | "completed" | "defaulted";
  createdAt: number;
  dueDate: number;
  percentageFunded: number;
}[]> {
  try {
    // Ensure we have a provider and signer
    await ensureInitialized();
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    // Get current wallet address
    const currentAddress = await signer.getAddress();

    // Get all loans and filter for user's loans
    const allLoans = await getLoans();
    const userLoans = allLoans
      .filter(loan => loan.borrower.toLowerCase() === currentAddress.toLowerCase())
      .map(loan => {
        // Get loan details to ensure we have due date
        const loanWithDueDate = getLoanDetails(loan.id)
          .then(fullLoanDetails => {
            if (!fullLoanDetails) return null;
            return Number(fullLoanDetails.dueDate);
          })
          .catch(() => {
            console.error(`Failed to get due date for loan ${loan.id}`);
            return loan.createdAt + (loan.duration * 24 * 60 * 60); // Fallback calculation
          });

        return {
          ...loan,
          dueDate: loanWithDueDate, // Add due date
          percentageFunded: (loan.funded / loan.amount) * 100 // Calculate funding progress
        };
      });

    // Wait for all due dates to be resolved
    const loansWithDueDates = await Promise.all(
      userLoans.map(async loan => {
        const dueDate = await loan.dueDate;
        return {
          ...loan,
          dueDate: typeof dueDate === 'number' ? dueDate : loan.createdAt + (loan.duration * 24 * 60 * 60)
        };
      })
    );

    console.log(`Found ${loansWithDueDates.length} loans created by ${currentAddress}`);
    return loansWithDueDates;
  } catch (error: any) {
    console.error("Error fetching user loans:", error);
    throw new Error(`Failed to fetch your loans: ${error.message || 'Unknown error occurred'}`);
  }
}

/**
 * Retrieves all available loans for funding (excluding user's own loans).
 * @returns A promise resolving to an array of loans available for funding.
 * @throws {Error} If there's an issue with provider initialization or contract interaction
 */
export async function getAvailableLoans(): Promise<{
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  interestRate: number;
  duration: number;
  funded: number;
  status: "funding" | "active" | "completed" | "defaulted";
  createdAt: number;
  dueDate: number;
  percentageFunded: number;
}[]> {
  try {
    // Ensure we have a provider and signer
    await ensureInitialized();
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    // Get current wallet address
    const currentAddress = await signer.getAddress();

    // Get all loans and filter out user's own loans and non-funding loans
    const allLoans = await getLoans();
    const availableLoans = allLoans
      .filter(loan => 
        loan.borrower.toLowerCase() !== currentAddress.toLowerCase() && // Not user's own loan
        loan.status === "funding" && // Only loans in funding state
        loan.funded < loan.amount // Not fully funded yet
      )
      .map(loan => ({
        ...loan,
        percentageFunded: (loan.funded / loan.amount) * 100 // Calculate funding progress
      }));

    console.log(`Found ${availableLoans.length} loans available for funding`);
    return availableLoans;

  } catch (error: any) {
    console.error("Error fetching available loans:", error);
    throw new Error(`Failed to fetch available loans: ${error.message || 'Unknown error occurred'}`);
  }
}

/**
 * Special debug version of fundLoan that provides more detailed logging and error information.
 * Use this to identify why funds aren't being transferred to the borrower.
 * @param loanId The ID of the loan to fund
 * @returns The transaction response
 */
export async function debugFundLoan(loanId: number | string): Promise<ContractTransactionResponse> {
    await ensureInitialized();
    if (!contract) throw new Error("Contract not initialized.");
    if (!signer) throw new Error("Wallet not connected.");
    if (!provider) throw new Error("Provider not initialized.");

    try {
        // Get loan details
        const loan = await getLoanDetails(loanId);
        if (!loan) throw new Error("Loan not found");

        // Get current address
        const currentAddress = await signer.getAddress();
        
        // Check borrower
        console.log(`Loan ${loanId} borrower: ${loan.borrower}`);
        console.log(`Current wallet: ${currentAddress}`);
        
        if (loan.borrower.toLowerCase() === currentAddress.toLowerCase()) {
            throw new Error("You cannot fund your own loan");
        }

        // Get contract balance before funding
        const contractBalanceBefore = await provider.getBalance(contractAddress);
        console.log(`Contract balance before funding: ${formatEther(contractBalanceBefore)} ETH`);
        
        // Get loan funding status
        console.log(`Loan ${loanId} amount: ${formatEther(loan.amount)} ETH`);
        console.log(`Loan ${loanId} currently funded: ${formatEther(loan.amountFunded)} ETH`);
        console.log(`Loan ${loanId} remaining needed: ${formatEther(loan.amount - loan.amountFunded)} ETH`);
        console.log(`Loan ${loanId} status: ${loan.status === 0 ? 'Funding' : 'Active'}`);
        
        // Get current wallet balance
        const walletBalance = await provider.getBalance(currentAddress);
        console.log(`Wallet balance: ${formatEther(walletBalance)} ETH`);
        
        // Use the full loan amount
        const fullAmount = loan.amount;
        console.log(`Attempting to fund with full amount: ${formatEther(fullAmount)} ETH`);
        
        // Execute transaction with higher gas limit and detailed logging
        const tx = await contract.fundLoan(BigInt(loanId), {
            value: fullAmount,
            gasLimit: 500000 // Even higher gas limit to ensure enough gas
        });
        console.log(`Transaction submitted: ${tx.hash}`);
        
        // Wait for transaction to be mined with more detailed logging
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");
        console.log("Transaction receipt:", receipt);
        
        // Check loan status after funding
        const updatedLoan = await getLoanDetails(loanId);
        if (!updatedLoan) throw new Error("Failed to get updated loan details");
        
        console.log(`Updated loan status: ${updatedLoan.status === 0 ? 'Funding' : 'Active'}`);
        console.log(`Updated loan funded amount: ${formatEther(updatedLoan.amountFunded)} ETH`);
        
        // Check contract balance after funding
        const contractBalanceAfter = await provider.getBalance(contractAddress);
        console.log(`Contract balance after funding: ${formatEther(contractBalanceAfter)} ETH`);
        
        // Check if transfer to borrower happened
        const borrowerBalance = await provider.getBalance(updatedLoan.borrower);
        console.log(`Borrower balance: ${formatEther(borrowerBalance)} ETH`);
        
        return tx;
    } catch (error: any) {
        console.error("Error in debugFundLoan:", error);
        if (error.code) console.error(`Error code: ${error.code}`);
        if (error.reason) console.error(`Error reason: ${error.reason}`);
        if (error.message) console.error(`Error message: ${error.message}`);
        if (error.transaction) console.error(`Error transaction: ${error.transaction}`);
        if (error.receipt) console.error(`Error receipt: ${error.receipt}`);
        throw error;
    }
}

/**
 * Allows a borrower to repay their loan with interest.
 * @param loanId The ID of the loan to repay
 * @returns The transaction response
 */
export async function repayLoan(loanId: number | string): Promise<ContractTransactionResponse> {
    await ensureInitialized();
    if (!contract) throw new Error("Contract not initialized.");
    if (!signer) throw new Error("Wallet not connected.");

    try {
        // Get loan details first to verify borrower and calculate repayment amount
        const loan = await getLoanDetails(loanId);
        if (!loan) {
            throw new Error("Loan not found");
        }

        // Get current wallet address
        const currentAddress = await signer.getAddress();
        
        // Check if user is the borrower
        if (loan.borrower.toLowerCase() !== currentAddress.toLowerCase()) {
            throw new Error("Only the borrower can repay this loan");
        }

        // Check if loan is in active status
        if (loan.status !== 1) { // 1 = LoanStatus.Active
            throw new Error("Loan is not in active status and cannot be repaid");
        }

        // Calculate total repayment amount (principal + interest)
        const interestAmount = (loan.amount * loan.interestRate) / 10000n; // Convert basis points
        const totalRepaymentAmount = loan.amount + interestAmount;
        
        console.log(`Repaying loan ${loanId}: Principal=${formatEther(loan.amount)} ETH, Interest=${formatEther(interestAmount)} ETH`);
        console.log(`Total repayment: ${formatEther(totalRepaymentAmount)} ETH`);

        // Execute the repayment transaction
        const tx = await contract.repayLoan(
            BigInt(loanId),
            { 
                value: totalRepaymentAmount,
                gasLimit: 500000 // Higher gas limit to ensure transaction completes
            }
        );
        
        console.log("Repayment transaction submitted:", tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Repayment confirmed! Receipt:", receipt);
        
        // Verify the loan is now completed
        const updatedLoan = await getLoanDetails(loanId);
        if (!updatedLoan) {
            throw new Error("Failed to fetch updated loan details after repayment");
        }
        
        console.log(`Updated loan status: ${updatedLoan.status === 2 ? "Completed" : "Not Completed"}`);
        
        if (updatedLoan.status === 2) { // 2 = LoanStatus.Completed
            console.log("✅ Loan successfully repaid!");
        } else {
            console.log("⚠️ Loan repayment might have failed, status is not Completed");
        }
        
        return tx;
    } catch (error: any) {
        console.error(`Error repaying loan ${loanId}:`, error.message || error);
        throw error; // Re-throw for UI handling
    }
}

/**
 * Switches the wallet to a different account
 * @returns Promise resolving to the new account address
 */
export async function switchWallet(): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask and reload.");
  }
  
  try {
    // Prompt user to select an account
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
    
    // Reinitialize with new account
    await initEthers();
    
    if (!signer) {
      throw new Error("Failed to get signer after switching wallet");
    }
    
    // Return the new address
    const newAddress = await signer.getAddress();
    console.log(`Switched to wallet: ${newAddress}`);
    
    return newAddress;
  } catch (error: any) {
    console.error("Error switching wallet:", error);
    throw new Error(`Failed to switch wallet: ${error.message || "Unknown error"}`);
  }
}

/**
 * Retrieves platform-wide statistics
 * @returns An object containing various platform metrics
 */
export async function getPlatformStats(): Promise<{
  totalLoans: number;
  totalVolume: number;
  activeLoanCount: number;
  activeLoanVolume: number;
  totalInvestors: number;
  totalBorrowers: number;
  averageInterestRate: number;
  averageLoanDuration: number;
  completedLoans: number;
  defaultedLoans: number;
  successRate: number;
}> {
  try {
    // Ensure we have a provider for read operations
    let readProvider = provider;
    if (!readProvider) {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No provider available. Please ensure MetaMask is installed and accessible.");
      }
      try {
        readProvider = new ethers.BrowserProvider(window.ethereum);
      } catch (providerError: any) {
        throw new Error(`Failed to initialize provider: ${providerError.message || 'Unknown provider error'}`);
      }
    }

    // Get all loans to calculate platform stats
    const loans = await getLoans();
    
    if (!loans.length) {
      return {
        totalLoans: 0,
        totalVolume: 0,
        activeLoanCount: 0,
        activeLoanVolume: 0,
        totalInvestors: 0,
        totalBorrowers: 0,
        averageInterestRate: 0,
        averageLoanDuration: 0,
        completedLoans: 0,
        defaultedLoans: 0,
        successRate: 0
      };
    }
    
    // Calculate platform statistics
    const totalLoans = loans.length;
    const totalVolume = loans.reduce((sum, loan) => sum + loan.amount, 0);
    
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const activeLoanCount = activeLoans.length;
    const activeLoanVolume = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);
    
    const completedLoans = loans.filter(loan => loan.status === 'completed').length;
    const defaultedLoans = loans.filter(loan => loan.status === 'defaulted').length;
    
    // Calculate success rate (completed loans / (completed + defaulted))
    const successRate = completedLoans + defaultedLoans === 0 ? 
      100 : // If no loans are completed or defaulted yet, show 100%
      (completedLoans / (completedLoans + defaultedLoans)) * 100;
    
    // Get unique borrowers and calculate average interest rate and duration
    const borrowers = new Set(loans.map(loan => loan.borrower.toLowerCase()));
    const totalBorrowers = borrowers.size;
    
    // We'd need additional data for unique investors which would require looping through 
    // each loan and getting all investors. For now, set to a placeholder
    const totalInvestors = 0; // This would require additional contract calls
    
    // Calculate average interest rate and duration
    const averageInterestRate = loans.reduce((sum, loan) => sum + loan.interestRate, 0) / totalLoans;
    const averageLoanDuration = loans.reduce((sum, loan) => sum + loan.duration, 0) / totalLoans;
    
    return {
      totalLoans,
      totalVolume,
      activeLoanCount,
      activeLoanVolume,
      totalInvestors,
      totalBorrowers,
      averageInterestRate,
      averageLoanDuration,
      completedLoans,
      defaultedLoans,
      successRate
    };
  } catch (error: any) {
    console.error("Failed to fetch platform stats:", error.message || error);
    // Return zeros on error rather than throwing
    return {
      totalLoans: 0,
      totalVolume: 0,
      activeLoanCount: 0,
      activeLoanVolume: 0,
      totalInvestors: 0,
      totalBorrowers: 0,
      averageInterestRate: 0,
      averageLoanDuration: 0,
      completedLoans: 0,
      defaultedLoans: 0,
      successRate: 0
    };
  }
}

// If the getUserStats function doesn't exist yet, implement it as well
/**
 * Retrieves statistics specific to the connected user
 * @returns An object containing user-specific metrics
 */
export async function getUserStats(): Promise<{
  totalBorrowed: number;
  totalInvested: number;
  activeLoans: number;
  activeInvestments: number;
  reputation: number;
}> {
  try {
    await ensureInitialized();
    if (!signer) throw new Error("Wallet not connected.");
    
    // Get user address
    const address = await signer.getAddress();
    
    // Get user's loans
    const userLoans = await getUserLoans();
    
    // Calculate total borrowed and active loans
    const totalBorrowed = userLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const activeLoans = userLoans.filter(loan => loan.status === 'active').length;
    
    // For investments, we would need to get all loans the user has invested in
    // This is a simplified version and might need adjustment based on contract
    const totalInvested = 0; // Placeholder - would need contract data
    const activeInvestments = 0; // Placeholder - would need contract data
    
    // Reputation is calculated based on completed loans, payment history, etc.
    // For now, hardcode a decent score for demo purposes
    const reputation = 85;
    
    return {
      totalBorrowed,
      totalInvested,
      activeLoans,
      activeInvestments,
      reputation
    };
  } catch (error: any) {
    console.error("Failed to fetch user stats:", error.message || error);
    return {
      totalBorrowed: 0,
      totalInvested: 0,
      activeLoans: 0,
      activeInvestments: 0,
      reputation: 0
    };
  }
}

// --- Removed/Non-MVP Functions ---
// Ensure any UI components previously calling these are updated or removed.
/*
export async function repayLoan(...) { ... }
export async function claimRepayment(...) { ... }
export async function getLoanActivity(...) { ... }
export async function getUserInvestments(...) { ... }
*/
