import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { config } from './config';

export interface SwapOptions {
  from: string;
  to: string;
  fromAmount?: string;
  toAmount?: string;
  fromToken?: string;
  toToken?: string;
  maker?: string;
  timelock?: string;
}

export interface QuoteOptions {
  from: string;
  to: string;
  amount: string;
  fromToken: string;
  toToken: string;
}

export class SwapCLI {
  private resolverUrl: string;

  constructor() {
    this.resolverUrl = process.env.RESOLVER_URL || 'http://localhost:3002';
  }

  async createSwap(options: SwapOptions) {
    // Convert chain names to IDs
    const srcChainId = this.getChainId(options.from);
    const dstChainId = this.getChainId(options.to);

    if (!options.maker) {
      throw new Error('Maker address is required. Use -m or --maker option.');
    }
    if (!options.fromToken) {
      throw new Error('Source token address is required. Use -ft or --from-token option.');
    }
    if (!options.toToken) {
      throw new Error('Destination token address is required. Use -tt or --to-token option.');
    }
    if (!options.fromAmount) {
      throw new Error('Source amount is required. Use -fa or --from-amount option.');
    }
    if (!options.toAmount) {
      throw new Error('Destination amount is required. Use -ta or --to-amount option.');
    }

    const timelock = Math.floor(Date.now() / 1000) + (parseInt(options.timelock || '24') * 60 * 60);

    try {
      const response = await axios.post(`${this.resolverUrl}/swap/create`, {
        maker: options.maker,
        srcChainId,
        dstChainId,
        srcToken: options.fromToken,
        dstToken: options.toToken,
        srcAmount: options.fromAmount,
        dstAmount: options.toAmount,
        timelock
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}. Make sure the resolver is running with 'yarn dev:resolver'.`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async executeSwap(orderHash: string, signature?: string) {
    if (!signature) {
      throw new Error('Maker signature is required for execution');
    }

    try {
      const response = await axios.post(`${this.resolverUrl}/swap/execute`, {
        orderHash,
        makerSignature: signature
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async getSwapStatus(orderHash: string) {
    try {
      const response = await axios.get(`${this.resolverUrl}/swap/${orderHash}/status`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async getQuote(options: QuoteOptions) {
    const srcChainId = this.getChainId(options.from);
    const dstChainId = this.getChainId(options.to);

    if (!options.amount) {
      throw new Error('Amount is required for quote');
    }
    if (!options.fromToken) {
      throw new Error('Source token address is required');
    }
    if (!options.toToken) {
      throw new Error('Destination token address is required');
    }

    try {
      const response = await axios.post(`${this.resolverUrl}/quote`, {
        srcChainId,
        dstChainId,
        srcToken: options.fromToken,
        dstToken: options.toToken,
        amount: options.amount
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async getSupportedTokens(chain: string) {
    const chainId = this.getChainId(chain);
    try {
      const response = await axios.get(`${this.resolverUrl}/tokens/${chainId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}. Make sure the resolver is running with 'yarn dev:resolver'.`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async withdraw(orderHash: string, secret: string, chain: string) {
    const chainId = this.getChainId(chain);
    try {
      const response = await axios.post(`${this.resolverUrl}/withdraw`, {
        orderHash,
        secret,
        chainId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async cancel(orderHash: string, chain: string) {
    const chainId = this.getChainId(chain);
    try {
      const response = await axios.post(`${this.resolverUrl}/cancel`, {
        orderHash,
        chainId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Cannot connect to resolver service at ${this.resolverUrl}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  async interactiveSwap() {
    console.log(chalk.blue('🌉 Welcome to Swap Garden Cross-Chain Swap!'));
    console.log(chalk.gray('This wizard will guide you through creating a cross-chain swap.\n'));

    // Step 1: Select chains
    const { sourceChain, destinationChain } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sourceChain',
        message: 'Select source chain:',
        choices: [
          { name: 'Polygon Amoy', value: 'amoy' },
          { name: 'Ethereum Sepolia', value: 'sepolia' }
        ]
      },
      {
        type: 'list',
        name: 'destinationChain',
        message: 'Select destination chain:',
        choices: [
          { name: 'Polygon Amoy', value: 'amoy' },
          { name: 'Ethereum Sepolia', value: 'sepolia' }
        ],
        validate: (value, answers) => {
          if (value === answers.sourceChain) {
            return 'Destination chain must be different from source chain';
          }
          return true;
        }
      }
    ]);

    // Step 2: Get supported tokens
    const spinner = ora('Loading supported tokens...').start();
    try {
      const [sourceTokens, destTokens] = await Promise.all([
        this.getSupportedTokens(sourceChain),
        this.getSupportedTokens(destinationChain)
      ]);
      spinner.succeed('Tokens loaded');

      // Step 3: Select tokens
      const { fromToken, toToken } = await inquirer.prompt([
        {
          type: 'list',
          name: 'fromToken',
          message: `Select token on ${sourceChain}:`,
          choices: sourceTokens.tokens.map((token: any) => ({
            name: `${token.symbol} (${token.name})`,
            value: token.address
          }))
        },
        {
          type: 'list',
          name: 'toToken',
          message: `Select token on ${destinationChain}:`,
          choices: destTokens.tokens.map((token: any) => ({
            name: `${token.symbol} (${token.name})`,
            value: token.address
          }))
        }
      ]);

      // Step 4: Enter amounts and maker address
      const { amount, maker, timelock } = await inquirer.prompt([
        {
          type: 'input',
          name: 'amount',
          message: 'Enter amount to swap:',
          validate: (value) => {
            if (!value || isNaN(parseFloat(value))) {
              return 'Please enter a valid amount';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'maker',
          message: 'Enter maker address:',
          validate: (value) => {
            if (!ethers.isAddress(value)) {
              return 'Please enter a valid Ethereum address';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'timelock',
          message: 'Enter timelock in hours (default: 24):',
          default: '24',
          validate: (value) => {
            if (isNaN(parseInt(value)) || parseInt(value) < 1) {
              return 'Please enter a valid number of hours (minimum 1)';
            }
            return true;
          }
        }
      ]);

      // Step 5: Get quote
      const quoteSpinner = ora('Getting quote...').start();
      const quote = await this.getQuote({
        from: sourceChain,
        to: destinationChain,
        amount,
        fromToken,
        toToken
      });
      quoteSpinner.succeed('Quote retrieved');

      console.log(chalk.green('\n💰 Quote Details:'));
      console.log(`Source Amount: ${quote.srcAmount}`);
      console.log(`Destination Amount: ${quote.dstAmount}`);
      console.log(`Rate: ${quote.rate}`);
      console.log(`Price Impact: ${quote.priceImpact}`);
      console.log(`Fee: ${quote.fee}`);

      // Step 6: Confirm creation
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Do you want to create this swap order?',
          default: true
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Swap creation cancelled.'));
        return;
      }

      // Step 7: Create swap order
      const createSpinner = ora('Creating swap order...').start();
      const swapOrder = await this.createSwap({
        from: sourceChain,
        to: destinationChain,
        fromAmount: amount,
        toAmount: quote.dstAmount,
        fromToken,
        toToken,
        maker,
        timelock
      });
      createSpinner.succeed('Swap order created successfully!');

      console.log(chalk.green('\n✅ Cross-chain swap order created!'));
      console.log(chalk.blue('Order Hash:'), swapOrder.orderHash);
      console.log(chalk.blue('Secret:'), swapOrder.secret);
      console.log(chalk.yellow('\n⚠️  Important: Save the secret! You will need it to claim your tokens.'));
      console.log(chalk.gray('\nTo execute this swap, run:'));
      console.log(chalk.white(`swap-garden execute ${swapOrder.orderHash} --signature <your-signature>`));

    } catch (error: any) {
      spinner.fail('Failed to load tokens');
      throw error;
    }
  }

  private getChainId(chain: string): number {
    const chainConfig = config.chains.find(c => c.name.toLowerCase() === chain.toLowerCase());
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}. Supported chains: amoy, sepolia`);
    }
    return chainConfig.chainId;
  }
} 