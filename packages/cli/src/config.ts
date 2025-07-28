export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}

export const config = {
  chains: [
    {
      chainId: 80002,
      name: 'amoy',
      rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      blockExplorer: 'https://amoy.polygonscan.com',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    },
    {
      chainId: 11155111,
      name: 'sepolia',
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      blockExplorer: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      }
    }
  ] as ChainConfig[],

  tokens: [
    // Polygon Amoy testnet tokens
    {
      address: '0x4e3B2f1Ee4bbB1d4B9F86A3e4c8e3b9C0c8e4e4e',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 80002
    },
    {
      address: '0x5B3f4e3B2f1Ee4bbB1d4B9F86A3e4c8e3b9C0c8e',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      chainId: 80002
    },
    {
      address: '0x6f21B0bF48a99e8D2A5f4D4A6B4B4B4B4B4B4B4B',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      chainId: 80002
    },

    // Ethereum Sepolia testnet tokens
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      symbol: 'LINK',
      name: 'Chainlink Token',
      decimals: 18,
      chainId: 11155111
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI', 
      name: 'Uniswap',
      decimals: 18,
      chainId: 11155111
    },
    {
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      chainId: 11155111
    }
  ] as TokenConfig[],

  // Default resolver URL
  resolverUrl: process.env.RESOLVER_URL || 'http://localhost:3002',

  // Default timeouts
  timeouts: {
    transaction: 300000, // 5 minutes
    confirmation: 60000,  // 1 minute
    quote: 10000         // 10 seconds
  },

  // Fee configuration
  fees: {
    gasLimitMultiplier: 1.2,
    gasPriceMultiplier: 1.1,
    maxFeePerGas: '50000000000', // 50 gwei
    maxPriorityFeePerGas: '2000000000' // 2 gwei
  }
}; 