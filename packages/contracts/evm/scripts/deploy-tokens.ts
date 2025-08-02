import { ethers } from "hardhat";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🌸 Deploying Mock ERC20 Tokens with Flower Names...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  const networkName = hre.network.name;
  
  console.log(`\n🌐 Deploying on ${networkName} (Chain ID: ${chainId})`);

  // Define flower tokens based on chain
  let tokenName: string;
  let tokenSymbol: string;
  let decimals: number;

  if (chainId === 11155111n) { // Sepolia
    tokenName = "Rose";
    tokenSymbol = "ROSE";
    decimals = 18;
    console.log("🌹 Deploying Rose token on Sepolia");
  } else if (chainId === 80002n) { // Polygon Amoy
    tokenName = "Tulip"; 
    tokenSymbol = "TULIP";
    decimals = 6; // USDC-like decimals for better testing
    console.log("🌷 Deploying Tulip token on Polygon Amoy");
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Deploy MockERC20
  console.log(`\n📦 Deploying ${tokenName} (${tokenSymbol})...`);
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(tokenName, tokenSymbol, decimals);
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log(`✅ ${tokenName} deployed to: ${tokenAddress}`);

  // Addresses to fund
  const addressesToFund = [
    "0xb91b06369b605182AA3d9100B589Ca1ADa502c53", // Taker
    "0x04104D06fa5DB229ce02309aab0373Ab27095d8C"  // Maker
  ];

  // Mint tokens to specified addresses
  console.log("\n💰 Minting tokens to specified addresses...");
  const mintAmount = decimals === 18 
    ? ethers.parseEther("10000") // 10,000 tokens for 18 decimal tokens
    : ethers.parseUnits("10000", decimals); // 10,000 tokens for other decimals

  for (const address of addressesToFund) {
    console.log(`🪙 Minting ${ethers.formatUnits(mintAmount, decimals)} ${tokenSymbol} to ${address}...`);
    const mintTx = await token.mint(address, mintAmount);
    await mintTx.wait();
    console.log(`✅ Minted! TX: ${mintTx.hash}`);
    
    // Verify balance
    const balance = await token.balanceOf(address);
    console.log(`📊 Balance: ${ethers.formatUnits(balance, decimals)} ${tokenSymbol}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    token: {
      name: tokenName,
      symbol: tokenSymbol,
      decimals: decimals,
      address: tokenAddress
    },
    deployer: await deployer.getAddress(),
    deployedAt: new Date().toISOString(),
    fundedAddresses: addressesToFund.map(addr => ({
      address: addr,
      amount: ethers.formatUnits(mintAmount, decimals)
    }))
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `token-${tokenSymbol.toLowerCase()}-${chainId}.json`;
  const filePath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${filePath}`);

  // Verification (if not on local network)
  if (process.env.HARDHAT_NETWORK !== "hardhat" && process.env.HARDHAT_NETWORK !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await token.deploymentTransaction()?.wait(6);
    
    console.log("🔍 Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [tokenName, tokenSymbol, decimals],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }

  console.log(`\n🎉 ${tokenName} (${tokenSymbol}) deployment completed!`);
  console.log(`📍 Contract Address: ${tokenAddress}`);
  console.log(`💎 Total Supply Minted: ${ethers.formatUnits(mintAmount * BigInt(addressesToFund.length), decimals)} ${tokenSymbol}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 