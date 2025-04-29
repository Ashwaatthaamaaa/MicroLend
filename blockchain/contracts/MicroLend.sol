// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MicroLend MVP
 * @dev Simplified contract for creating and funding microloans on Sepolia testnet.
 */
contract MicroLend {
    // Simple counter to replace OpenZeppelin's Counters
    uint256 private _loanIdCounter = 0;
    
    // --- Enums ---
    enum LoanStatus { Funding, Active, Completed, Defaulted } // Added Completed and Defaulted statuses

    // --- Structs ---
    struct Loan {
        uint256 id;
        address payable borrower;
        uint256 amount; // Requested loan amount in Wei
        uint256 interestRate; // Annual interest rate in basis points (e.g., 500 = 5%)
        uint256 duration; // Loan duration in seconds
        string purpose;
        LoanStatus status;
        uint256 amountFunded; // Amount funded so far in Wei
        uint256 createdAt;
        uint256 dueDate;
    }

    // --- State Variables ---
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => mapping(address => uint256)) public investments; // loanId => lender => amountInvested
    mapping(uint256 => address[]) public loanLenders; // loanId => list of lenders
    uint256[] public allLoanIds; // Simple array of all loan IDs

    // --- Events ---
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 duration);
    event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount);
    event LoanActivated(uint256 indexed loanId);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 repaymentAmount);
    event LenderPaid(uint256 indexed loanId, address indexed lender, uint256 amountPaid);
    event LoanDefaulted(uint256 indexed loanId);

    // --- Errors ---
    error LoanNotFound(uint256 loanId);
    error IncorrectStatus(LoanStatus requiredStatus, LoanStatus currentStatus);
    error InsufficientFunds();
    error AlreadyFullyFunded();
    error AmountMustBePositive();
    error DurationMustBePositive();
    error TransferFailed();
    error NotBorrower();
    error InsufficientRepaymentAmount();
    error RepaymentFailed();

    // --- Functions ---

    /**
     * @dev Creates a new loan request.
     * @param _amount Requested amount in Wei.
     * @param _interestRate Annual interest rate in basis points (e.g., 500 = 5%).
     * @param _durationDays Loan duration in days.
     * @param _purpose Description of the loan's purpose.
     */
    function createLoan(
        uint256 _amount,
        uint256 _interestRate,
        uint256 _durationDays,
        string memory _purpose
    ) public {
        if (_amount == 0) revert AmountMustBePositive();
        if (_durationDays == 0) revert DurationMustBePositive();

        // Increment counter and get new ID
        _loanIdCounter++;
        uint256 newLoanId = _loanIdCounter;
        
        uint256 durationSeconds = _durationDays * 1 days;
        uint256 creationTime = block.timestamp;

        Loan storage newLoan = loans[newLoanId];
        newLoan.id = newLoanId;
        newLoan.borrower = payable(msg.sender);
        newLoan.amount = _amount;
        newLoan.interestRate = _interestRate;
        newLoan.duration = durationSeconds;
        newLoan.purpose = _purpose;
        newLoan.status = LoanStatus.Funding;
        newLoan.amountFunded = 0;
        newLoan.createdAt = creationTime;
        newLoan.dueDate = creationTime + durationSeconds; // Calculate dueDate

        allLoanIds.push(newLoanId);

        emit LoanCreated(newLoanId, msg.sender, _amount, _interestRate, durationSeconds);
    }

    /**
     * @dev Allows a lender to fund a loan. Sends excess ETH back if overfunded.
     * Transfers the total loan amount to the borrower when fully funded.
     * @param _loanId The ID of the loan to fund.
     */
    function fundLoan(uint256 _loanId) public payable {
        Loan storage loan = loans[_loanId];

        if (loan.id == 0) revert LoanNotFound(_loanId);
        if (loan.status != LoanStatus.Funding) revert IncorrectStatus(LoanStatus.Funding, loan.status);
        if (msg.value == 0) revert InsufficientFunds(); // Revert if sender sends 0 ETH
        if (loan.amountFunded >= loan.amount) revert AlreadyFullyFunded();

        uint256 amountToFund = msg.value;
        uint256 remainingNeeded = loan.amount - loan.amountFunded;

        // Handle overfunding: calculate excess and send it back
        if (amountToFund > remainingNeeded) {
            uint256 excess = amountToFund - remainingNeeded;
            amountToFund = remainingNeeded; // Only fund what's needed
            // Send back excess ETH immediately
             (bool success, ) = msg.sender.call{value: excess}("");
            if (!success) revert TransferFailed(); // Revert if sending back excess fails
        }

        // Update loan funding state only if a positive amount is being funded
        if (amountToFund > 0) {
            loan.amountFunded = loan.amountFunded + amountToFund;

            // Track investment amount per lender
            investments[_loanId][msg.sender] = investments[_loanId][msg.sender] + amountToFund;

            // Add lender to the list only if they are investing for the first time in this loan
            // Check the previous investment amount before adding the current amount
            if ((investments[_loanId][msg.sender] - amountToFund) == 0) {
                 loanLenders[_loanId].push(msg.sender);
            }

            emit LoanFunded(_loanId, msg.sender, amountToFund);
        }

        // Check if the loan is now fully funded
        if (loan.amountFunded == loan.amount) {
            loan.status = LoanStatus.Active;

            // Transfer the total collected funds to the borrower
            (bool success, ) = loan.borrower.call{value: loan.amount}("");
            if (!success) revert TransferFailed(); // Revert if final transfer fails

            emit LoanActivated(_loanId);
        }
    }

    /**
     * @dev Allows a borrower to repay their loan with interest.
     * Repayment is distributed to lenders based on their contribution percentage.
     * @param _loanId The ID of the loan to repay.
     */
    function repayLoan(uint256 _loanId) public payable {
        Loan storage loan = loans[_loanId];

        // Validate loan and borrower
        if (loan.id == 0) revert LoanNotFound(_loanId);
        if (loan.status != LoanStatus.Active) revert IncorrectStatus(LoanStatus.Active, loan.status);
        if (msg.sender != loan.borrower) revert NotBorrower();

        // Calculate total repayment amount (principal + interest)
        uint256 interestAmount = (loan.amount * loan.interestRate) / 10000; // Convert basis points to actual percentage
        uint256 totalRepaymentAmount = loan.amount + interestAmount;

        // Ensure borrower sent enough funds
        if (msg.value < totalRepaymentAmount) revert InsufficientRepaymentAmount();

        // Process refund if borrower sent more than needed
        if (msg.value > totalRepaymentAmount) {
            uint256 excessAmount = msg.value - totalRepaymentAmount;
            (bool refundSuccess, ) = msg.sender.call{value: excessAmount}("");
            if (!refundSuccess) revert TransferFailed();
        }

        // Distribute repayment to lenders
        address[] memory lenders = loanLenders[_loanId];
        bool distributionSuccess = true;

        for (uint256 i = 0; i < lenders.length; i++) {
            address lender = lenders[i];
            uint256 lenderInvestment = investments[_loanId][lender];
            
            // Calculate lender's share of the repayment (proportional to their investment)
            uint256 lenderShare = (lenderInvestment * totalRepaymentAmount) / loan.amount;
            
            // Transfer funds to lender
            (bool success, ) = payable(lender).call{value: lenderShare}("");
            if (!success) {
                distributionSuccess = false;
            } else {
                emit LenderPaid(_loanId, lender, lenderShare);
            }
        }

        if (!distributionSuccess) revert RepaymentFailed();

        // Update loan status
        loan.status = LoanStatus.Completed;
        
        // Emit repayment event
        emit LoanRepaid(_loanId, msg.sender, totalRepaymentAmount);
    }

    /**
     * @dev Marks a loan as defaulted. In a production system, this would likely be
     * called by an admin or automated system after the due date has passed.
     * @param _loanId The ID of the loan to mark as defaulted.
     */
    function markLoanAsDefaulted(uint256 _loanId) public {
        Loan storage loan = loans[_loanId];
        
        if (loan.id == 0) revert LoanNotFound(_loanId);
        if (loan.status != LoanStatus.Active) revert IncorrectStatus(LoanStatus.Active, loan.status);
        
        // In a production system, you would add access control and validation logic here
        // For MVP, we'll just check if the due date has passed
        if (block.timestamp <= loan.dueDate) {
            revert("Loan is not yet due");
        }
        
        loan.status = LoanStatus.Defaulted;
        emit LoanDefaulted(_loanId);
    }

    // --- View Functions ---

    /**
     * @dev Returns the details of a specific loan.
     * @param _loanId The ID of the loan.
     * @return Loan The loan struct.
     */
    function getLoanDetails(uint256 _loanId) public view returns (Loan memory) {
        if (loans[_loanId].id == 0) revert LoanNotFound(_loanId);
        return loans[_loanId];
    }

    /**
     * @dev Returns an array of all loan IDs created.
     * @return uint256[] Array of loan IDs.
     */
    function getAllLoanIds() public view returns (uint256[] memory) {
        return allLoanIds;
    }

    /**
     * @dev Returns the amount invested by a specific lender in a specific loan.
     * @param _loanId The ID of the loan.
     * @param _lender The address of the lender.
     * @return uint256 The amount invested in Wei.
     */
    function getLenderInvestment(uint256 _loanId, address _lender) public view returns (uint256) {
        // No need to check if loan exists explicitly, mapping returns 0 if not found
        // However, adding the check improves consistency and provides a clearer error
        if (loans[_loanId].id == 0) revert LoanNotFound(_loanId);
        return investments[_loanId][_lender];
    }

    /**
     * @dev Calculates the total repayment amount for a loan (principal + interest).
     * @param _loanId The ID of the loan.
     * @return uint256 The total repayment amount in Wei.
     */
    function calculateRepaymentAmount(uint256 _loanId) public view returns (uint256) {
        Loan memory loan = loans[_loanId];
        if (loan.id == 0) revert LoanNotFound(_loanId);
        
        uint256 interestAmount = (loan.amount * loan.interestRate) / 10000; // Convert basis points to actual percentage
        return loan.amount + interestAmount;
    }
}
