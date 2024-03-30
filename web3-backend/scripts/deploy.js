const hre = require("hardhat");
const SocioTokenAddress = "";
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getSecondsOfDays(day) {
  return day * 24 * 60 * 60;
}
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Deploying SocioTrade Contract...");

  const SocioTrade = await hre.ethers.deployContract("SocioTrade", [SocioTokenAddress]);

  await SocioTrade.waitForDeployment();

  console.log(
    "SocioTrade Deployed Successfully on Mentioned Network",
    SocioTrade.target
  );

  console.log("Waiting for 30 Seconds to Verify the Contract on Etherscan");
  await sleep(30 * 1000);

  // // Verify the RektLock Contract
  await hre.run("verify:verify", {
    address: SocioTrade.target,
    constructorArguments: [SocioTokenAddress],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
