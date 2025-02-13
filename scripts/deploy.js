async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const TypingStats = await ethers.getContractFactory("TypingStats");
  const typingStats = await TypingStats.deploy();

  await typingStats.deployed();

  console.log("TypingStats deployed to:", typingStats.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 