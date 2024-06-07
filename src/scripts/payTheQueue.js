// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function handleReceivedWETH() {
  const stakingContractAddress = "0x0d729dcD944f892D05Ff9B98eb67fb05a13E8A0a";

  // Get the first signer for demonstration purposes
  const [signer] = await ethers.getSigners();

  // Attach to the already deployed contract
  const stakingContract = await ethers.getContractAt(
    "SimpleStaking",
    stakingContractAddress,
    signer
  );

  try {
    // Sending a transaction to handle received WETH and process the unstake queue
    const tx = await stakingContract.handleReceivedWETH();
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Full receipt:", receipt);
  } catch (error) {
    console.error("Error processing unstake queue:", error);
    throw error; // Rethrow to handle errors accordingly
  }
}

async function main() {
  try {
    await handleReceivedWETH();
  } catch (error) {
    console.error(error);
    process.exit(1); // Exit with failure in case of an error
  }
}

main();