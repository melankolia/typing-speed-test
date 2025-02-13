const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const TypingStats = await hre.ethers.getContractFactory("TypingStats");
  const typingStats = await TypingStats.deploy();

  await typingStats.waitForDeployment();

  console.log("TypingStats deployed to:", await typingStats.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 