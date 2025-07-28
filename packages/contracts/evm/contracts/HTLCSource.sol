// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title HTLCSource
 * @dev Hash Time Locked Contract for the source chain
 */
contract HTLCSource is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { PENDING, WITHDRAWN, CANCELLED }

    struct HTLCData {
        bytes32 orderHash;
        address maker;
        address makerAsset;
        uint256 makingAmount;
        address takerAsset;
        uint256 takingAmount;
        bytes32 hashLock;
        uint256 timelock;
        uint256 dstChainId;
        State state;
        address withdrawnBy;
        bytes32 preimage;
    }

    HTLCData public htlcData;

    event Withdrawn(
        bytes32 indexed orderHash,
        address indexed withdrawnBy,
        bytes32 preimage
    );

    event Cancelled(
        bytes32 indexed orderHash,
        address indexed cancelledBy
    );

    modifier onlyAfterTimelock() {
        require(block.timestamp >= htlcData.timelock, "Timelock not yet passed");
        _;
    }

    modifier onlyBeforeTimelock() {
        require(block.timestamp < htlcData.timelock, "Timelock has passed");
        _;
    }

    modifier onlyPending() {
        require(htlcData.state == State.PENDING, "Contract not in pending state");
        _;
    }

    constructor(
        bytes32 orderHash,
        address maker,
        address makerAsset,
        uint256 makingAmount,
        address takerAsset,
        uint256 takingAmount,
        bytes32 hashLock,
        uint256 timelock,
        uint256 dstChainId
    ) {
        htlcData = HTLCData({
            orderHash: orderHash,
            maker: maker,
            makerAsset: makerAsset,
            makingAmount: makingAmount,
            takerAsset: takerAsset,
            takingAmount: takingAmount,
            hashLock: hashLock,
            timelock: timelock,
            dstChainId: dstChainId,
            state: State.PENDING,
            withdrawnBy: address(0),
            preimage: bytes32(0)
        });
    }

    /**
     * @dev Withdraw funds by providing the secret preimage
     * @param preimage The secret that hashes to hashLock
     */
    function withdraw(bytes32 preimage) 
        external 
        nonReentrant 
        onlyBeforeTimelock 
        onlyPending 
    {
        require(keccak256(abi.encodePacked(preimage)) == htlcData.hashLock, "Invalid preimage");

        htlcData.state = State.WITHDRAWN;
        htlcData.withdrawnBy = msg.sender;
        htlcData.preimage = preimage;

        // Transfer tokens to the caller (should be the resolver/taker)
        IERC20(htlcData.makerAsset).safeTransfer(msg.sender, htlcData.makingAmount);

        emit Withdrawn(htlcData.orderHash, msg.sender, preimage);
    }

    /**
     * @dev Cancel the contract and return funds to maker after timelock
     */
    function cancel() 
        external 
        nonReentrant 
        onlyAfterTimelock 
        onlyPending 
    {
        htlcData.state = State.CANCELLED;

        // Return tokens to the original maker
        IERC20(htlcData.makerAsset).safeTransfer(htlcData.maker, htlcData.makingAmount);

        emit Cancelled(htlcData.orderHash, msg.sender);
    }

    /**
     * @dev Get contract details
     */
    function getDetails() external view returns (HTLCData memory) {
        return htlcData;
    }

    /**
     * @dev Check if contract can be withdrawn
     */
    function canWithdraw(bytes32 preimage) external view returns (bool) {
        return htlcData.state == State.PENDING && 
               block.timestamp < htlcData.timelock &&
               keccak256(abi.encodePacked(preimage)) == htlcData.hashLock;
    }

    /**
     * @dev Check if contract can be cancelled
     */
    function canCancel() external view returns (bool) {
        return htlcData.state == State.PENDING && block.timestamp >= htlcData.timelock;
    }
} 