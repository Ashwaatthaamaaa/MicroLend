MicroLend
Deployed at ⬇️ https://v0-p2-p-microfinance-mvp.vercel.app/

MicroLend is a decentralized microfinance platform built on the Polygon blockchain. It empowers individuals and small businesses by providing access to microloans in a transparent and secure peer-to-peer environment. The platform connects borrowers directly with lenders, facilitating financial inclusion and opportunity.

Features
Decentralized Lending: Leverages the Polygon blockchain for secure and transparent loan transactions.

User-Friendly Interface: A clean and intuitive interface for a seamless user experience.

Loan Management:

Create Loan Requests: Borrowers can create detailed loan requests, specifying the amount, purpose, duration, and desired interest rate.

Browse and Fund Loans: Lenders can browse available loan requests and fund them directly.

Dashboard: A personalized dashboard for users to manage their active loans, investments, and track their portfolio.

Reputation System: Users build a reputation score based on their borrowing and lending history.

Wallet Integration: Seamlessly connect with Ethereum wallets like MetaMask to interact with the platform.

Real-time Statistics: View platform-wide statistics, including the total number of loans, active loans, and total volume.

Tech Stack
Framework: Next.js

Language: TypeScript

Styling: Tailwind CSS

UI Components: shadcn/ui

Blockchain Interaction: Ethers.js

State Management: React Hooks

Form Handling: React Hook Form

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Node.js

pnpm (or your preferred package manager)

Installation
Clone the repository:

Bash

git clone https://github.com/Ashwaatthaamaaa/MicroLend.git
Navigate to the project directory:

Bash

cd MicroLend
Install dependencies:

Bash

pnpm install
Run the development server:

Bash

pnpm dev
Open http://localhost:3000 with your browser to see the result.

Project Structure
The project follows a standard Next.js app directory structure.

app/: Contains all the routes and pages of the application.

app/api/: API routes.

app/dashboard/: The user's dashboard page.

app/loans/: The page for Browse and viewing loans.

app/create/: The page for creating a new loan request.

components/: Contains all the React components.

components/ui/: Reusable UI components from shadcn/ui.

components/connect-wallet.tsx: The wallet connection component.

components/create-loan-form.tsx: The form for creating a new loan.

components/loans-list.tsx: Component to display a list of loans.

components/user-investments.tsx: Component to display a user's investments.

components/user-loans.tsx: Component to display a user's loans.

hooks/: Custom React hooks.

lib/: Contains library functions and utilities.

lib/loan-contract.ts: Contains the ABI and functions for interacting with the smart contract.

lib/utils.ts: Utility functions.

Smart Contract
The MicroLend platform is powered by a smart contract on the Polygon network. The contract handles the core logic for creating, funding, and managing loans.

Note: The current implementation in lib/loan-contract.ts uses a placeholder contract address for MVP purposes.

Key Functions
createLoan: Creates a new loan request.

fundLoan: Allows a lender to fund a loan.

repayLoan: Allows a borrower to repay a loan.

claimRepayment: Allows a lender to claim their repayment.

getLoanDetails: Retrieves the details of a specific loan.

getUserLoans: Retrieves all loans for a specific borrower.

getUserInvestments: Retrieves all investments for a specific lender.

getPlatformStats: Retrieves platform-wide statistics.

getUserStats: Retrieves statistics for a specific user, including their reputation score.

Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

License
This project is licensed under the MIT License. See the LICENSE file for more information.