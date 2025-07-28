#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SwapCLI } from './swap-cli';

const program = new Command();
const swapCLI = new SwapCLI();

program
  .name('swap-garden')
  .description('Cross-chain swap CLI for Swap Garden protocol')
  .version('0.1.0');

// Create swap order command
program
  .command('create')
  .description('Create a cross-chain swap order')
  .option('-f, --from <chain>', 'Source chain (amoy, sepolia)', 'amoy')
  .option('-t, --to <chain>', 'Destination chain (amoy, sepolia)', 'sepolia')
  .option('-fa, --from-amount <amount>', 'Amount to swap from source chain')
  .option('-ta, --to-amount <amount>', 'Expected amount on destination chain')
  .option('-ft, --from-token <address>', 'Source token address')
  .option('-tt, --to-token <address>', 'Destination token address')
  .option('-m, --maker <address>', 'Maker address')
  .option('-tl, --timelock <hours>', 'Timelock in hours', '24')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔄 Creating cross-chain swap order...'));
      const result = await swapCLI.createSwap(options);
      console.log(chalk.green('✅ Swap order created successfully!'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to create swap:'), error.message);
      process.exit(1);
    }
  });

// Execute swap command
program
  .command('execute')
  .description('Execute a pending swap order')
  .argument('<orderHash>', 'Order hash to execute')
  .option('-s, --signature <signature>', 'Maker signature')
  .action(async (orderHash, options) => {
    try {
      console.log(chalk.blue('⚡ Executing swap order...'));
      const result = await swapCLI.executeSwap(orderHash, options.signature);
      console.log(chalk.green('✅ Swap executed successfully!'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to execute swap:'), error.message);
      process.exit(1);
    }
  });

// Get swap status command
program
  .command('status')
  .description('Get status of a swap order')
  .argument('<orderHash>', 'Order hash to check')
  .action(async (orderHash) => {
    try {
      console.log(chalk.blue('📊 Getting swap status...'));
      const result = await swapCLI.getSwapStatus(orderHash);
      if (result) {
        console.log(chalk.green('✅ Swap status retrieved:'));
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.yellow('⚠️  Swap order not found'));
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
      process.exit(1);
    }
  });

// Get quote command
program
  .command('quote')
  .description('Get a quote for cross-chain swap')
  .option('-f, --from <chain>', 'Source chain (amoy, sepolia)', 'amoy')
  .option('-t, --to <chain>', 'Destination chain (amoy, sepolia)', 'sepolia')
  .option('-a, --amount <amount>', 'Amount to swap')
  .option('-ft, --from-token <address>', 'Source token address')
  .option('-tt, --to-token <address>', 'Destination token address')
  .action(async (options) => {
    try {
      console.log(chalk.blue('💰 Getting swap quote...'));
      const quote = await swapCLI.getQuote(options);
      console.log(chalk.green('✅ Quote retrieved:'));
      console.log(JSON.stringify(quote, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to get quote:'), error.message);
      process.exit(1);
    }
  });

// List supported tokens command
program
  .command('tokens')
  .description('List supported tokens for a chain')
  .argument('<chain>', 'Chain name (amoy, sepolia)')
  .action(async (chain) => {
    try {
      console.log(chalk.blue(`🪙 Getting supported tokens for ${chain}...`));
      const tokens = await swapCLI.getSupportedTokens(chain);
      console.log(chalk.green('✅ Supported tokens:'));
      console.log(JSON.stringify(tokens, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to get tokens:'), error.message);
      process.exit(1);
    }
  });

// Withdraw command
program
  .command('withdraw')
  .description('Withdraw funds from HTLC using secret')
  .argument('<orderHash>', 'Order hash')
  .argument('<secret>', 'Secret preimage')
  .option('-c, --chain <chain>', 'Chain to withdraw from (amoy, sepolia)')
  .action(async (orderHash, secret, options) => {
    try {
      console.log(chalk.blue('💸 Withdrawing from HTLC...'));
      const result = await swapCLI.withdraw(orderHash, secret, options.chain);
      console.log(chalk.green('✅ Withdrawal successful!'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to withdraw:'), error.message);
      process.exit(1);
    }
  });

// Cancel command
program
  .command('cancel')
  .description('Cancel HTLC after timelock expires')
  .argument('<orderHash>', 'Order hash')
  .option('-c, --chain <chain>', 'Chain to cancel on (amoy, sepolia)')
  .action(async (orderHash, options) => {
    try {
      console.log(chalk.blue('❌ Cancelling HTLC...'));
      const result = await swapCLI.cancel(orderHash, options.chain);
      console.log(chalk.green('✅ Cancellation successful!'));
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error(chalk.red('❌ Failed to cancel:'), error.message);
      process.exit(1);
    }
  });

// Interactive swap command
program
  .command('swap')
  .description('Interactive cross-chain swap wizard')
  .action(async () => {
    try {
      console.log(chalk.blue('🧙 Starting interactive swap wizard...'));
      await swapCLI.interactiveSwap();
    } catch (error: any) {
      console.error(chalk.red('❌ Interactive swap failed:'), error.message);
      process.exit(1);
    }
  });

program.parse(); 