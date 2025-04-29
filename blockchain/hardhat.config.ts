require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Loads environment variables from .env file

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // Updated to match Lock.sol pragma
  networks: {
    hardhat: {
      // Configuration for the local Hardhat Network (optional)
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // Get URL from .env file
      accounts:
        process.env.SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.SEPOLIA_PRIVATE_KEY]
          : [], // Get private key from .env file
      chainId: 11155111, // Sepolia's chain ID
    },
  },
  gasReporter: { // Optional configuration for gas reporting
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: { // Optional configuration for Etherscan verification
    apiKey: process.env.ETHERSCAN_API_KEY || "", // Get API key from .env file
  },
};