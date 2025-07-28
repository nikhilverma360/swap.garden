// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./HTLCSource.sol";
import "./HTLCDestination.sol";

/**
 * @title HTLCFactory
 * @dev Factory contract for deploying HTLC contracts for cross-chain swaps
 */
contract HTLCFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event HTLCSourceDeployed(
        address indexed htlc,
        bytes32 indexed orderHash,
        address indexed maker,
        address takerAsset,
        uint256 takingAmount,
        bytes32 hashLock,
        uint256 timelock
    );

    event HTLCDestinationDeployed(
        address indexed htlc,
        bytes32 indexed orderHash,
        address indexed taker,
        address makerAsset,
        uint256 makingAmount,
        bytes32 hashLock,
        uint256 timelock
    );

    mapping(bytes32 => address) public sourceHTLCs;
    mapping(bytes32 => address) public destinationHTLCs;
    
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 7 days;
    
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploy source HTLC contract
     * @param orderHash Unique identifier for the swap order
     * @param maker Address of the order maker
     * @param makerAsset Token being provided by maker
     * @param makingAmount Amount being provided by maker
     * @param takerAsset Token expected on destination chain
     * @param takingAmount Amount expected on destination chain
     * @param hashLock Hash of the secret
     * @param timelock Timestamp after which the contract can be cancelled
     * @param dstChainId Destination chain ID
     */
    function deploySourceHTLC(
        bytes32 orderHash,
        address maker,
        address makerAsset,
        uint256 makingAmount,
        address takerAsset,
        uint256 takingAmount,
        bytes32 hashLock,
        uint256 timelock,
        uint256 dstChainId
    ) external nonReentrant returns (address htlc) {
        require(sourceHTLCs[orderHash] == address(0), "HTLC already exists");
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(makingAmount > 0, "Amount must be greater than 0");

        // Transfer tokens from maker to this contract temporarily
        IERC20(makerAsset).safeTransferFrom(maker, address(this), makingAmount);

        // Deploy HTLC contract
        HTLCSource sourceContract = new HTLCSource(
            orderHash,
            maker,
            makerAsset,
            makingAmount,
            takerAsset,
            takingAmount,
            hashLock,
            timelock,
            dstChainId
        );

        htlc = address(sourceContract);
        sourceHTLCs[orderHash] = htlc;

        // Transfer tokens to the HTLC contract
        IERC20(makerAsset).safeTransfer(htlc, makingAmount);

        emit HTLCSourceDeployed(
            htlc,
            orderHash,
            maker,
            takerAsset,
            takingAmount,
            hashLock,
            timelock
        );
    }

    /**
     * @dev Deploy destination HTLC contract
     * @param orderHash Unique identifier for the swap order
     * @param taker Address of the order taker (resolver)
     * @param makerAsset Token being provided on source chain
     * @param makingAmount Amount being provided on source chain
     * @param takerAsset Token being provided on destination chain
     * @param takingAmount Amount being provided on destination chain
     * @param hashLock Hash of the secret
     * @param timelock Timestamp after which the contract can be cancelled
     * @param srcChainId Source chain ID
     */
    function deployDestinationHTLC(
        bytes32 orderHash,
        address taker,
        address makerAsset,
        uint256 makingAmount,
        address takerAsset,
        uint256 takingAmount,
        bytes32 hashLock,
        uint256 timelock,  
        uint256 srcChainId
    ) external nonReentrant returns (address htlc) {
        require(destinationHTLCs[orderHash] == address(0), "HTLC already exists");
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(takingAmount > 0, "Amount must be greater than 0");

        // Transfer tokens from taker to this contract temporarily
        IERC20(takerAsset).safeTransferFrom(taker, address(this), takingAmount);

        // Deploy HTLC contract
        HTLCDestination destContract = new HTLCDestination(
            orderHash,
            taker,
            makerAsset,
            makingAmount,
            takerAsset,
            takingAmount,
            hashLock,
            timelock,
            srcChainId
        );

        htlc = address(destContract);
        destinationHTLCs[orderHash] = htlc;

        // Transfer tokens to the HTLC contract
        IERC20(takerAsset).safeTransfer(htlc, takingAmount);

        emit HTLCDestinationDeployed(
            htlc,
            orderHash,
            taker,
            makerAsset,
            makingAmount,
            hashLock,
            timelock
        );
    }

    /**
     * @dev Get source HTLC address for order
     */
    function getSourceHTLC(bytes32 orderHash) external view returns (address) {
        return sourceHTLCs[orderHash];
    }

    /**
     * @dev Get destination HTLC address for order
     */
    function getDestinationHTLC(bytes32 orderHash) external view returns (address) {
        return destinationHTLCs[orderHash];
    }
} 