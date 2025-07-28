import { ethers } from "hardhat";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying HTLC contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy HTLCFactory
  console.log("Deploying HTLCFactory...");
  const HTLCFactory = await ethers.getContractFactory("HTLCFactory");
  const htlcFactory = await HTLCFactory.deploy();
  
  await htlcFactory.waitForDeployment();
  const factoryAddress = await htlcFactory.getAddress();
  
  console.log("HTLCFactory deployed to:", factoryAddress);

  // Save deployment addresses
  const networkName = (await ethers.provider.getNetwork()).name;
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contracts: {
      HTLCFactory: factoryAddress
    },
    deployer: await deployer.getAddress(),
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${networkName}-${chainId}.json`;
  const filePath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${filePath}`);

  // Verification (if not on local network)
  if (process.env.HARDHAT_NETWORK !== "hardhat" && process.env.HARDHAT_NETWORK !== "localhost") {
    console.log("Waiting for block confirmations...");
    await htlcFactory.deploymentTransaction()?.wait(6);
    
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 