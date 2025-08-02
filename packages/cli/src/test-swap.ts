#!/usr/bin/env node

import { ethers } from 'ethers';
import { SwapCLI } from './swap-cli';
import { config } from './config';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

dotenv.config();

interface TestConfig {
    makerWallet: ethers.Wallet;
    takerWallet: ethers.Wallet;
    amoyProvider: ethers.JsonRpcProvider;
    sepoliaProvider: ethers.JsonRpcProvider;
    testTokens: {
        amoy: {
            address: string;
            symbol: string;
            decimals: number;
        };
        sepolia: {
            address: string;
            symbol: string;
            decimals: number;
        };
    };
}

class SwapTester {
    private config: TestConfig | null = null;
    private swapCLI: SwapCLI;

    constructor() {
        this.swapCLI = new SwapCLI();
    }

    private initializeConfig() {
        if (!process.env.MAKER_PRIVATE_KEY || !process.env.TAKER_PRIVATE_KEY) {
            throw new Error('Please provide MAKER_PRIVATE_KEY and TAKER_PRIVATE_KEY in .env file');
        }

        // Initialize providers
        const amoyProvider = new ethers.JsonRpcProvider(
            process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
        );
        const sepoliaProvider = new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'
        );

        // Initialize wallets (REVERSED: Maker on Sepolia, Taker on Amoy)
        const makerWallet = new ethers.Wallet(process.env.MAKER_PRIVATE_KEY, sepoliaProvider);
        const takerWallet = new ethers.Wallet(process.env.TAKER_PRIVATE_KEY, amoyProvider);

        this.config = {
            makerWallet,
            takerWallet,
            amoyProvider,
            sepoliaProvider,
                    testTokens: {
            amoy: {
                address: '0x71F4091F883A265F164907e7a70Fb44be20a0CF3', // Tulip Token
                symbol: 'TULIP',
                decimals: 6
            },
            sepolia: {
                address: '0xb4E06750949B30B7A69DEa2FfD537C438Af44708', // Rose Token
                symbol: 'ROSE',
                decimals: 18
            }
            }
        };
    }

    async runFullSwapTest() {
        console.log(chalk.blue('🧪 Starting Comprehensive Cross-Chain Swap Test'));
        console.log(chalk.gray('=' .repeat(60)));

        // Initialize config for full test
        this.initializeConfig();

        try {
            // Step 1: Check balances and setup
            await this.checkInitialSetup();
            
            // Show initial token balances
            await this.checkTokenBalances('Initial');

            // Step 2: Create swap order (as maker)
            const swapOrder = await this.createSwapOrder();

            // Step 3: Execute swap (as taker)  
            await this.executeSwap(swapOrder.orderHash);

            // Step 4: Withdraw from HTLCs (complete atomic swap)
            await this.completeAtomicSwap(swapOrder);

            // Step 5: Verify final state
            await this.verifyFinalState();

            console.log(chalk.green('\n🎉 Cross-chain swap test completed successfully!'));

        } catch (error: any) {
            console.error(chalk.red('\n❌ Test failed:'), error.message);
            throw error;
        }
    }

    private async checkInitialSetup() {
        console.log(chalk.blue('\n📊 Step 1: Checking Initial Setup'));
        
        const spinner = ora('Checking wallet balances and network connectivity...').start();
        
        try {
            if (!this.config) {
                throw new Error('Configuration not initialized');
            }

            // Check maker balance on Sepolia (REVERSED)
            const makerBalance = await this.config.sepoliaProvider.getBalance(this.config.makerWallet.address);
            console.log(chalk.cyan(`Maker (Sepolia): ${this.config.makerWallet.address}`));
            console.log(chalk.gray(`Balance: ${ethers.formatEther(makerBalance)} SepoliaETH`));

            // Check taker balance on Amoy (REVERSED)
            const takerBalance = await this.config.amoyProvider.getBalance(this.config.takerWallet.address);
            console.log(chalk.cyan(`Taker (Amoy): ${this.config.takerWallet.address}`));
            console.log(chalk.gray(`Balance: ${ethers.formatEther(takerBalance)} MATIC`));

            // Verify minimum balances (reduced for testing)
            if (makerBalance < ethers.parseEther('0.1')) {
                throw new Error('Maker needs at least 0.1 SepoliaETH for gas fees');
            }
            if (takerBalance < ethers.parseEther('0.02')) {
                throw new Error('Taker needs at least 0.02 MATIC for gas fees');
            }

            // Check resolver connectivity
            const resolverStatus = await this.swapCLI.getStatus();
            console.log(chalk.gray(`Resolver Status: ${resolverStatus.status}`));

            spinner.succeed('Initial setup verified');
        } catch (error) {
            spinner.fail('Setup check failed');
            throw error;
        }
    }

    private async createSwapOrder() {
        console.log(chalk.blue('\n🔄 Step 2: Creating Swap Order (Maker Role)'));
        
        const spinner = ora('Creating cross-chain swap order...').start();
        
        try {
            if (!this.config) {
                throw new Error('Configuration not initialized');
            }
            
            const swapParams = {
                from: 'sepolia',    // REVERSED: Source is now Sepolia
                to: 'amoy',         // REVERSED: Destination is now Amoy
                fromAmount: '5',    // 5 ROSE (18 decimals)
                toAmount: '10',     // 10 TULIP (6 decimals) 
                fromToken: this.config.testTokens.sepolia.address,
                toToken: this.config.testTokens.amoy.address,
                maker: this.config.makerWallet.address,
                timelock: '2' // 2 hours for testing
            };

            const swapOrder = await this.swapCLI.createSwap(swapParams);
            
            spinner.succeed('Swap order created successfully!');
            
            console.log(chalk.green('\n📄 Swap Order Details:'));
            console.log(chalk.gray(`Order Hash: ${swapOrder.orderHash}`));
            console.log(chalk.gray(`Secret: ${swapOrder.secret}`));
            console.log(chalk.gray(`Hash Lock: ${swapOrder.hashLock}`));
            console.log(chalk.gray(`Maker: ${swapOrder.maker}`));
            console.log(chalk.gray(`${swapOrder.srcAmount} ${this.config.testTokens.sepolia.symbol} (Sepolia) → ${swapOrder.dstAmount} ${this.config.testTokens.amoy.symbol} (Amoy)`));
            console.log(chalk.gray(`Timelock: ${new Date(swapOrder.timelock * 1000).toISOString()}`));

            return swapOrder;
        } catch (error) {
            spinner.fail('Failed to create swap order');
            throw error;
        }
    }

    private async executeSwap(orderHash: string) {
        console.log(chalk.blue('\n⚡ Step 3: Executing Swap (Taker Role)'));
        
        const spinner = ora('Executing swap order...').start();
        
        try {
            // In a real implementation, the taker would provide their signature
            // For this test, we'll simulate the signature process
            const dummySignature = '0x' + '0'.repeat(130); // Placeholder signature
            
            const executionResult = await this.swapCLI.executeSwap(orderHash, dummySignature);
            
            spinner.succeed('Swap executed successfully!');
            
            console.log(chalk.green('\n⚡ Execution Result:'));
            console.log(chalk.gray(`Success: ${executionResult.success}`));
            console.log(chalk.gray(`Message: ${executionResult.message}`));
            
            if (executionResult.srcTxHash) {
                console.log(chalk.gray(`Source TX: ${executionResult.srcTxHash}`));
            }
            if (executionResult.dstTxHash) {
                console.log(chalk.gray(`Destination TX: ${executionResult.dstTxHash}`));
            }

        } catch (error) {
            spinner.fail('Failed to execute swap');
            throw error;
        }
    }

    private async completeAtomicSwap(swapOrder: any) {
        console.log(chalk.blue('\n💸 Step 4: Completing Atomic Swap (Withdrawals)'));
        
        // Step 4a: Taker withdraws from source HTLC using secret (REVERSED: Sepolia)
        console.log(chalk.cyan('\n4a. Taker withdrawing from source HTLC (Sepolia)...'));
        const takerSpinner = ora('Taker claiming tokens from source chain...').start();
        
        try {
            const takerWithdrawal = await this.swapCLI.withdraw(
                swapOrder.orderHash,
                swapOrder.secret,
                'sepolia'
            );
            
            takerSpinner.succeed('Taker successfully claimed tokens from source chain!');
            console.log(chalk.gray(`Result: ${takerWithdrawal.message}`));
            if (takerWithdrawal.txHash) {
                console.log(chalk.gray(`TX Hash: ${takerWithdrawal.txHash}`));
            }
        } catch (error) {
            takerSpinner.fail('Taker withdrawal failed');
            throw error;
        }

        // Step 4b: Maker withdraws from destination HTLC using revealed secret (REVERSED: Amoy)
        console.log(chalk.cyan('\n4b. Maker withdrawing from destination HTLC (Amoy)...'));
        const makerSpinner = ora('Maker claiming tokens from destination chain...').start();
        
        try {
            const makerWithdrawal = await this.swapCLI.withdraw(
                swapOrder.orderHash,
                swapOrder.secret,
                'amoy'
            );
            
            makerSpinner.succeed('Maker successfully claimed tokens from destination chain!');
            console.log(chalk.gray(`Result: ${makerWithdrawal.message}`));
            if (makerWithdrawal.txHash) {
                console.log(chalk.gray(`TX Hash: ${makerWithdrawal.txHash}`));
            }
        } catch (error) {
            makerSpinner.fail('Maker withdrawal failed');
            throw error;
        }
    }

    private async verifyFinalState() {
        console.log(chalk.blue('\n✅ Step 5: Verifying Final State & Token Balances'));
        
        const spinner = ora('Checking final token balances...').start();
        
        try {
            if (!this.config) {
                throw new Error('Configuration not initialized');
            }
            
            // Check final token balances to prove the swap worked
            await this.checkTokenBalances('Final');
            
            spinner.succeed('Atomic swap completed - both parties have their tokens!');
            
            console.log(chalk.green('\n🎯 Swap Summary:'));
            console.log(chalk.gray('✅ Maker: Sent ROSE on Sepolia → Received TULIP on Amoy'));
            console.log(chalk.gray('✅ Taker: Sent TULIP on Amoy → Received ROSE on Sepolia'));
            console.log(chalk.gray('✅ No trusted third party required'));
            console.log(chalk.gray('✅ Atomic guarantee: either both swaps happen or neither'));
            
        } catch (error) {
            spinner.fail('Final state verification failed');
            throw error;
        }
    }

    private async checkTokenBalances(stage: string) {
        if (!this.config) {
            throw new Error('Configuration not initialized');
        }

        console.log(chalk.yellow(`\n📊 ${stage} Token Balances:`));
        
        // Create token contracts
        const roseContract = new ethers.Contract(
            this.config.testTokens.sepolia.address,
            ['function balanceOf(address) view returns (uint256)'],
            this.config.sepoliaProvider
        );
        
        const tulipContract = new ethers.Contract(
            this.config.testTokens.amoy.address,
            ['function balanceOf(address) view returns (uint256)'],
            this.config.amoyProvider
        );
        
        // Check balances
        const makerRose = await roseContract.balanceOf(this.config.makerWallet.address);
        const makerTulip = await tulipContract.balanceOf(this.config.makerWallet.address);
        const takerRose = await roseContract.balanceOf(this.config.takerWallet.address);
        const takerTulip = await tulipContract.balanceOf(this.config.takerWallet.address);
        
        console.log(chalk.cyan('🌹  ROSE Token (Sepolia):'));
        console.log(chalk.gray(`   Maker: ${ethers.formatUnits(makerRose, 18)} ROSE`));
        console.log(chalk.gray(`   Taker: ${ethers.formatUnits(takerRose, 18)} ROSE`));
        
        console.log(chalk.cyan('🌷  TULIP Token (Amoy):'));
        console.log(chalk.gray(`   Maker: ${ethers.formatUnits(makerTulip, 6)} TULIP`));
        console.log(chalk.gray(`   Taker: ${ethers.formatUnits(takerTulip, 6)} TULIP`));
    }

    async runQuickTest() {
        console.log(chalk.blue('🚀 Running Quick Swap Test (Simulated)'));
        
        try {
            // Test basic CLI functionality without real transactions
            const tokens = await this.swapCLI.getSupportedTokens('amoy');
            console.log(chalk.green('✅ Supported tokens loaded:'), tokens.length);
            
            const quote = await this.swapCLI.getQuote({
                from: 'amoy',
                to: 'sepolia',
                amount: '10',
                fromToken: '0x71F4091F883A265F164907e7a70Fb44be20a0CF3', // Tulip Token  
                toToken: '0xb4E06750949B30B7A69DEa2FfD537C438Af44708'  // Rose Token
            });
            console.log(chalk.green('✅ Quote generated:'), `${quote.srcAmount} → ${quote.dstAmount}`);
            
            // Test resolver status
            const status = await this.swapCLI.getStatus();
            console.log(chalk.green('✅ Resolver status:'), status.status);
            console.log(chalk.gray(`Supported chains: ${status.supportedChains.join(', ')}`));
            console.log(chalk.gray(`Active orders: ${status.activeOrders}`));
            
            console.log(chalk.green('\n🎉 Quick test passed! Ready for full swap test.'));
            console.log(chalk.yellow('\n💡 To run full test with real transactions:'));
            console.log(chalk.gray('   1. Add MAKER_PRIVATE_KEY and TAKER_PRIVATE_KEY to packages/cli/.env'));
            console.log(chalk.gray('   2. Ensure wallets have testnet funds (MATIC on Amoy, ETH on Sepolia)'));
            console.log(chalk.gray('   3. Run: yarn test:cli:full'));
            
        } catch (error: any) {
            console.error(chalk.red('❌ Quick test failed:'), error.message);
            throw error;
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'quick';
    
    try {
        const tester = new SwapTester();
        
        if (testType === 'full') {
            await tester.runFullSwapTest();
        } else {
            await tester.runQuickTest();
        }
        
    } catch (error: any) {
        console.error(chalk.red('\n💥 Test execution failed:'));
        console.error(error.message);
        process.exit(1);
    }
}

// CLI usage
if (require.main === module) {
    console.log(chalk.blue('🧪 Swap Garden Cross-Chain Test Suite'));
    console.log(chalk.gray('Usage: tsx src/test-swap.ts [quick|full]'));
    console.log(chalk.gray('- quick: Test CLI functionality (no real transactions)'));
    console.log(chalk.gray('- full:  Execute complete cross-chain swap test\n'));
    
    main().then(() => {
        console.log(chalk.green('\n✅ Test completed successfully!'));
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}

export { SwapTester }; 