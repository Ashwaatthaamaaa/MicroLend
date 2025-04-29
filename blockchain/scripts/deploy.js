const hre = require("hardhat");
const fs = require("fs"); // Node.js file system module
const path = require("path"); // Node.js path module

async function main() {
  const contractName = "MicroLend"; // Make sure this matches your contract name

  console.log(`Deploying ${contractName} contract...`);

  // Get the contract factory
  const microLendFactory = await hre.ethers.getContractFactory(contractName);

  // Deploy the contract
  const microLend = await microLendFactory.deploy();

  // Wait for the deployment transaction to be mined (ethers v6 style)
  // For ethers v5, you would use `await microLend.deployed()`
  await microLend.waitForDeployment(); // Use this for Hardhat-ethers v6 compatibility

  // Get the deployed contract address (ethers v6 style)
  // For ethers v5, you would use `microLend.address`
  const contractAddress = await microLend.getAddress();

  console.log(`${contractName} contract deployed to: ${contractAddress}`);

  // --- Save contract address and ABI to frontend ---
  console.log("Saving contract artifacts to frontend...");

  // Define the path to the frontend directory relative to this script
  const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "lib", "contracts");

  // Create the frontend contracts directory if it doesn't exist
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
    console.log(`Created directory: ${frontendContractsDir}`);
  }

  // Save the contract address
  fs.writeFileSync(
    path.join(frontendContractsDir, "contract-address.json"),
    JSON.stringify({ address: contractAddress }, null, 2) // Use null, 2 for pretty printing
  );
  console.log(`Contract address saved to ${path.join(frontendContractsDir, "contract-address.json")}`);

  // Find the contract artifact (adjust path if your structure differs)
   const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);

   if (fs.existsSync(artifactPath)) {
     // Read the artifact JSON file
     const contractArtifact = require(artifactPath);

     // Save the full artifact (including ABI)
     fs.writeFileSync(
       path.join(frontendContractsDir, `${contractName}.json`),
       JSON.stringify(contractArtifact, null, 2) // Pretty print the JSON
     );
     console.log(`Contract ABI (artifact) saved to ${path.join(frontendContractsDir, `${contractName}.json`)}`);
   } else {
      console.error(`Error: Artifact not found at ${artifactPath}. Did you compile the contract?`);
   }


  console.log("\nDeployment complete and artifacts copied to frontend/lib/contracts/");
}

main().catch((error) => {
  console.error("Deployment script failed:", error);
  process.exitCode = 1;
});