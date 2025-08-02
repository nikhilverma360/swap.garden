import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { HTLCFactory, HTLCSource, HTLCDestination } from "../typechain-types";

describe("HTLCFactory", function () {
  let htlcFactory: HTLCFactory;
  let owner: SignerWithAddress;
  let maker: SignerWithAddress;
  let taker: SignerWithAddress;
  let mockToken: any;

  const orderHash = ethers.keccak256(ethers.toUtf8Bytes("test-order"));
  const secret = "0x" + "1".repeat(64);
  const hashLock = ethers.keccak256(ethers.toUtf8Bytes(secret));
  const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  beforeEach(async function () {
    [owner, maker, taker] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Deploy HTLCFactory
    const HTLCFactory = await ethers.getContractFactory("HTLCFactory");
    htlcFactory = await HTLCFactory.deploy();
    await htlcFactory.waitForDeployment();

    // Mint tokens to maker and taker
    await mockToken.mint(maker.address, ethers.parseEther("1000"));
    await mockToken.mint(taker.address, ethers.parseEther("1000"));
  });

  describe("Source HTLC Deployment", function () {
    it("Should deploy source HTLC successfully", async function () {
      const makingAmount = ethers.parseEther("100");
      const takingAmount = ethers.parseEther("99");

      // Approve tokens to factory
      await mockToken.connect(maker).approve(htlcFactory.target, makingAmount);

      const tx = await htlcFactory.connect(maker).deploySourceHTLC(
        orderHash,
        maker.address,
        mockToken.target,
        makingAmount,
        mockToken.target,
        takingAmount,
        hashLock,
        timelock,
        80002 // Polygon Amoy chain ID
      );

      await expect(tx)
        .to.emit(htlcFactory, "HTLCSourceDeployed")
        .withArgs(
          await htlcFactory.getSourceHTLC(orderHash),
          orderHash,
          maker.address,
          mockToken.target,
          takingAmount,
          hashLock,
          timelock
        );

      const sourceHTLCAddress = await htlcFactory.getSourceHTLC(orderHash);
      expect(sourceHTLCAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should reject duplicate source HTLC deployment", async function () {
      const makingAmount = ethers.parseEther("100");
      const takingAmount = ethers.parseEther("99");

      await mockToken.connect(maker).approve(htlcFactory.target, makingAmount * 2n);

      await htlcFactory.connect(maker).deploySourceHTLC(
        orderHash,
        maker.address,
        mockToken.target,
        makingAmount,
        mockToken.target,
        takingAmount,
        hashLock,
        timelock,
        80002
      );

      await expect(
        htlcFactory.connect(maker).deploySourceHTLC(
          orderHash,
          maker.address,
          mockToken.target,
          makingAmount,
          mockToken.target,
          takingAmount,
          hashLock,
          timelock,
          80002
        )
      ).to.be.revertedWith("HTLC already exists");
    });
  });

  describe("Destination HTLC Deployment", function () {
    it("Should deploy destination HTLC successfully", async function () {
      const makingAmount = ethers.parseEther("100");
      const takingAmount = ethers.parseEther("99");

      // Approve tokens to factory
      await mockToken.connect(taker).approve(htlcFactory.target, takingAmount);

      const tx = await htlcFactory.connect(taker).deployDestinationHTLC(
        orderHash,
        taker.address,
        mockToken.target,
        makingAmount,
        mockToken.target,
        takingAmount,
        hashLock,
        timelock,
        11155111 // Sepolia chain ID
      );

      await expect(tx)
        .to.emit(htlcFactory, "HTLCDestinationDeployed")
        .withArgs(
          await htlcFactory.getDestinationHTLC(orderHash),
          orderHash,
          taker.address,
          mockToken.target,
          makingAmount,
          hashLock,
          timelock
        );

      const destHTLCAddress = await htlcFactory.getDestinationHTLC(orderHash);
      expect(destHTLCAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("HTLC Workflow", function () {
    it("Should complete full HTLC workflow", async function () {
      const makingAmount = ethers.parseEther("100");
      const takingAmount = ethers.parseEther("99");

      // Deploy source HTLC
      await mockToken.connect(maker).approve(htlcFactory.target, makingAmount);
      await htlcFactory.connect(maker).deploySourceHTLC(
        orderHash,
        maker.address,
        mockToken.target,
        makingAmount,
        mockToken.target,
        takingAmount,
        hashLock,
        timelock,
        80002
      );

      // Deploy destination HTLC
      await mockToken.connect(taker).approve(htlcFactory.target, takingAmount);
      await htlcFactory.connect(taker).deployDestinationHTLC(
        orderHash,
        taker.address,
        mockToken.target,
        makingAmount,
        mockToken.target,
        takingAmount,
        hashLock,
        timelock,
        11155111
      );

      const sourceHTLCAddress = await htlcFactory.getSourceHTLC(orderHash);
      const destHTLCAddress = await htlcFactory.getDestinationHTLC(orderHash);

      // Get HTLC contracts
      const HTLCSource = await ethers.getContractFactory("HTLCSource");
      const HTLCDestination = await ethers.getContractFactory("HTLCDestination");
      
      const sourceHTLC = HTLCSource.attach(sourceHTLCAddress);
      const destHTLC = HTLCDestination.attach(destHTLCAddress);

      // Verify initial state
      expect((await sourceHTLC.getDetails()).state).to.equal(0); // PENDING
      expect((await destHTLC.getDetails()).state).to.equal(0); // PENDING

      // Taker withdraws from source HTLC using secret
      await expect(sourceHTLC.connect(taker).withdraw(secret))
        .to.emit(sourceHTLC, "Withdrawn")
        .withArgs(orderHash, taker.address, secret);

      // Maker withdraws from destination HTLC using revealed secret
      await expect(destHTLC.connect(maker).withdraw(secret))
        .to.emit(destHTLC, "Withdrawn")
        .withArgs(orderHash, maker.address, secret);

      // Verify final state
      expect((await sourceHTLC.getDetails()).state).to.equal(1); // WITHDRAWN
      expect((await destHTLC.getDetails()).state).to.equal(1); // WITHDRAWN
    });
  });
}); 