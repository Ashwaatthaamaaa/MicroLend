const hre = require("hardhat");

async function main() {
  console.log("Deploying MicroLend contract...");

  const MicroLend = await hre.ethers.getContractFactory("MicroLend");
  const microLend = await MicroLend.deploy();

  await microLend.waitForDeployment();

  const address = await microLend.getAddress();
  console.log("MicroLend deployed to:", address);
  console.log("Transaction hash:", microLend.deploymentTransaction()?.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 