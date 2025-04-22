// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MicroLend is ReentrancyGuard {
    // --- Enums ---

    enum LoanStatus {
        Requested, // Initial state after borrower requests
        Funded,    // Lender has provided funds
        Repaid,    // Borrower has fully repaid
        Defaulted, // Loan term expired without full repayment
        Cancelled  // Borrower cancelled before funding
    }

    enum CollateralType {
        None,
        NFT,
        ERC20Token,
        Other // Represents off-chain or non-standard collateral described in terms
    }

    // --- Structs ---

    struct Loan {
        uint id;                    // Unique identifier for the loan
        address borrower;           // Address of the loan requester
        address lender;             // Address of the funder (0x0 until funded)
        uint amountRequested;       // Amount requested by borrower, in Wei
        uint interestRateBPS;       // Interest rate in Basis Points (1% = 100 BPS)
        uint durationSeconds;       // Loan duration in seconds
        uint requestedTimestamp;    // Timestamp when the loan was requested
        uint fundedTimestamp;       // Timestamp when the loan was funded
        uint repaymentDueDate;      // Timestamp when repayment is due (fundedTimestamp + durationSeconds)
        uint amountRepaid;          // Amount repaid so far, in Wei
        LoanStatus status;          // Current status of the loan
        string purpose;             // Short text describing loan purpose
        string detailsURI;          // URI (e.g., IPFS hash) for detailed description & terms
        CollateralType collateralType; // Type of collateral offered
        address collateralContract; // Address of the NFT/ERC20 contract (0x0 if None/Other)
        uint collateralValueOrId;   // ERC20 amount (smallest unit) or NFT token ID (0 if None/Other)
    }

    // --- State Variables ---

    mapping(uint => Loan) public loans;         // Mapping from loan ID to Loan struct
    uint public nextLoanId;                     // Counter to generate unique loan IDs
    mapping(address => uint[]) public loansByBorrower; // Track loans requested by an address
    mapping(address => uint[]) public loansByLender;   // Track loans funded by an address

    // Maximum allowable interest rate (e.g., 50% = 5000 BPS) - adjust as needed
    uint public constant MAX_INTEREST_RATE_BPS = 5000;
    // Minimum loan duration (e.g., 1 day) - adjust as needed
    uint public constant MIN_DURATION_SECONDS = 1 days; // or 86400 seconds


    // --- Events ---

    event LoanRequested(
        uint indexed loanId,
        address indexed borrower,
        uint amount,
        uint interestRateBPS,
        uint durationSeconds,
        CollateralType collateralType
    );

    event LoanFunded(
        uint indexed loanId,
        address indexed lender,
        uint fundedTimestamp,
        uint repaymentDueDate
    );

    event LoanRepaid(
        uint indexed loanId,
        uint amountRepaid // Could be partial or full repayment amount
    );

    event LoanCancelled(uint indexed loanId);

    // --- Functions ---

    /**
     * @notice Allows a user to request a new loan.
     * @dev Assumes input parameters have been pre-processed by the front-end/JS layer.
     * @param _amountRequestedWei Amount requested in Wei (MATIC's smallest unit).
     * @param _purpose Short purpose string.
     * @param _detailsURI URI (e.g., IPFS) containing detailed description and any specific terms.
     * @param _durationSeconds Loan duration in seconds.
     * @param _interestRateBPS Interest rate in basis points (e.g., 500 for 5%).
     * @param _collateralType Enum representing the type of collateral.
     * @param _collateralContract Address of the collateral contract (0x0 if type is None/Other).
     * @param _collateralValueOrId Amount/ID of the collateral (0 if type is None/Other).
     */
    function requestLoan(
        uint _amountRequestedWei,
        string memory _purpose,
        string memory _detailsURI,
        uint _durationSeconds,
        uint _interestRateBPS,
        CollateralType _collateralType,
        address _collateralContract,
        uint _collateralValueOrId
    ) public nonReentrant {

        // --- Input Validation ---
        require(_amountRequestedWei > 0, "MicroLend: Amount must be positive");
        require(_durationSeconds >= MIN_DURATION_SECONDS, "MicroLend: Duration too short");
        require(_interestRateBPS > 0 && _interestRateBPS <= MAX_INTEREST_RATE_BPS, "MicroLend: Invalid interest rate");
        require(bytes(_purpose).length > 0, "MicroLend: Purpose required"); // Basic check
        // require(bytes(_detailsURI).length > 0, "MicroLend: Details URI required"); // Basic check

        // Collateral validation
        if (_collateralType == CollateralType.None) {
            require(_collateralContract == address(0), "MicroLend: Contract must be 0x0 for None collateral");
            require(_collateralValueOrId == 0, "MicroLend: Value/ID must be 0 for None collateral");
        } else if (_collateralType == CollateralType.NFT || _collateralType == CollateralType.ERC20Token) {
            require(_collateralContract != address(0), "MicroLend: Collateral contract address required");
            require(_collateralValueOrId > 0, "MicroLend: Collateral value/ID required");
            // Optional: Further checks like verifying contract interfaces (IERC721, IERC20)
            // could be added, but increase gas cost. Assume valid inputs for now.
        }
        // No specific validation for CollateralType.Other, relies on description/terms in _detailsURI


        // --- State Updates ---
        uint loanId = nextLoanId;

        Loan storage newLoan = loans[loanId]; // Get storage pointer

        newLoan.id = loanId;
        newLoan.borrower = msg.sender; // The function caller is the borrower
        // lender remains address(0)
        newLoan.amountRequested = _amountRequestedWei;
        newLoan.interestRateBPS = _interestRateBPS;
        newLoan.durationSeconds = _durationSeconds;
        newLoan.requestedTimestamp = block.timestamp; // Record request time
        // fundedTimestamp, repaymentDueDate, amountRepaid remain 0/default
        newLoan.status = LoanStatus.Requested;
        newLoan.purpose = _purpose;
        newLoan.detailsURI = _detailsURI;
        newLoan.collateralType = _collateralType;
        newLoan.collateralContract = _collateralContract;
        newLoan.collateralValueOrId = _collateralValueOrId;

        // Add loan ID to the borrower's list
        loansByBorrower[msg.sender].push(loanId);

        // Increment the ID for the next loan
        nextLoanId++;

        // --- Emit Event ---
        emit LoanRequested(
            loanId,
            msg.sender,
            _amountRequestedWei,
            _interestRateBPS,
            _durationSeconds,
            _collateralType
        );
    }

    // --- Other Functions (to be implemented later) ---

    // function fundLoan(uint _loanId) public payable { ... }
    // function repayLoan(uint _loanId) public payable { ... }
    // function cancelLoanRequest(uint _loanId) public { ... }
    // function claimDefaultedCollateral(uint _loanId) public { ... } // Or liquidate
    // function getLoanDetails(uint _loanId) public view returns (Loan memory) { ... } // Helper view function
    // function getLoansByBorrower(address _borrower) public view returns (uint[] memory) { ... }
} 