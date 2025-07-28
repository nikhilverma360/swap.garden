import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

export interface SwapOrder {
    orderHash: string;
    maker: string;
    srcChainId: number;
    dstChainId: number;
    srcToken: string;
    dstToken: string;
    srcAmount: string;
    dstAmount: string;
    timelock: number;
    secret: string;
    hashLock: string;
    status: 'pending' | 'executed' | 'completed' | 'cancelled';
    createdAt: number;
}

export interface ChainConfig {
    chainId: number;
    rpcUrl: string;
    htlcFactory: string;
    name: string;
}

export interface TokenConfig {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
}

export class HTLCResolver {
    private orders: Map<string, SwapOrder> = new Map();
    private providers: Map<number, ethers.JsonRpcProvider> = new Map();
    private resolverWallet: Map<number, ethers.Wallet> = new Map();
    
    private readonly chains: ChainConfig[] = [
        {
            chainId: 11155111, // Sepolia
            rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
            htlcFactory: process.env.SEPOLIA_HTLC_FACTORY || '',
            name: 'Sepolia'
        },
        {
            chainId: 80002, // Polygon Amoy
            rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
            htlcFactory: process.env.POLYGON_AMOY_HTLC_FACTORY || '',
            name: 'Polygon Amoy'
        }
    ];

    private readonly tokens: Map<number, TokenConfig[]> = new Map([
        [11155111, [ // Sepolia
            {
                address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
                symbol: 'LINK',
                name: 'Chainlink Token',
                decimals: 18
            },
            {
                address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                symbol: 'UNI',
                name: 'Uniswap',
                decimals: 18
            }
        ]],
        [80002, [ // Polygon Amoy
            {
                address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6
            },
            {
                address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                symbol: 'WMATIC',
                name: 'Wrapped Matic',
                decimals: 18
            }
        ]]
    ]);

    constructor() {
        try {
            this.initializeProviders();
        } catch (error) {
            console.warn('Failed to initialize providers:', error);
            // Continue without providers for now - they'll be initialized on-demand
        }
    }

    private initializeProviders() {
        const resolverPrivateKey = process.env.RESOLVER_PRIVATE_KEY;
        if (!resolverPrivateKey) {
            console.warn('RESOLVER_PRIVATE_KEY not set - some features may not work');
            return;
        }

        for (const chain of this.chains) {
            try {
                const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
                const wallet = new ethers.Wallet(resolverPrivateKey, provider);
                
                this.providers.set(chain.chainId, provider);
                this.resolverWallet.set(chain.chainId, wallet);
                console.log(`Initialized provider for ${chain.name} (${chain.chainId})`);
            } catch (error) {
                console.warn(`Failed to initialize provider for ${chain.name}:`, error);
            }
        }
    }

    async createSwapOrder(params: {
        maker: string;
        srcChainId: number;
        dstChainId: number;
        srcToken: string;
        dstToken: string;
        srcAmount: string;
        dstAmount: string;
        timelock: number;
    }): Promise<SwapOrder> {
        try {
            // Generate secret and hash lock
            const secret = '0x' + randomBytes(32).toString('hex');
            const hashLock = ethers.keccak256(secret);
            
            // Ensure addresses are properly checksummed
            const maker = ethers.getAddress(params.maker);
            const srcToken = ethers.getAddress(params.srcToken);
            const dstToken = ethers.getAddress(params.dstToken);
            
            // Create order hash
            const orderData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256', 'uint256', 'address', 'address', 'uint256', 'uint256', 'bytes32', 'uint256'],
                [
                    maker,
                    params.srcChainId,
                    params.dstChainId,
                    srcToken,
                    dstToken,
                    params.srcAmount,
                    params.dstAmount,
                    hashLock,
                    params.timelock
                ]
            );
            const orderHash = ethers.keccak256(orderData);

            const order: SwapOrder = {
                orderHash,
                maker: params.maker,
                srcChainId: params.srcChainId,
                dstChainId: params.dstChainId,
                srcToken: params.srcToken,
                dstToken: params.dstToken,
                srcAmount: params.srcAmount,
                dstAmount: params.dstAmount,
                timelock: params.timelock,
                secret,
                hashLock,
                status: 'pending',
                createdAt: Math.floor(Date.now() / 1000)
            };

            this.orders.set(orderHash, order);
            console.log(`Created swap order: ${orderHash}`);
            return order;
        } catch (error) {
            console.error('Error creating swap order:', error);
            throw new Error(`Failed to create swap order: ${error.message}`);
        }
    }

    async executeSwap(orderHash: string, makerSignature: string): Promise<{
        success: boolean;
        srcTxHash?: string;
        dstTxHash?: string;
        message: string;
    }> {
        const order = this.orders.get(orderHash);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'pending') {
            throw new Error(`Order status is ${order.status}, cannot execute`);
        }

        try {
            // For now, just simulate successful execution
            // In a real implementation, this would deploy the HTLCs
            
            // Update order status
            order.status = 'executed';
            this.orders.set(orderHash, order);
            
            return {
                success: true,
                message: 'Swap executed successfully (simulated)'
            };
        } catch (error) {
            console.error('Execute swap error:', error);
            throw error;
        }
    }

    async getSwapStatus(orderHash: string): Promise<SwapOrder | null> {
        return this.orders.get(orderHash) || null;
    }

    async getSupportedTokens(chainId: number): Promise<TokenConfig[]> {
        return this.tokens.get(chainId) || [];
    }

    async getQuote(params: {
        srcChainId: number;
        dstChainId: number;
        srcToken: string;
        dstToken: string;
        amount: string;
    }): Promise<{
        srcAmount: string;
        dstAmount: string;
        rate: string;
        priceImpact: string;
        fee: string;
        timelock: number;
    }> {
        try {
            // Mock implementation - in production, this would query DEXs for real prices
            const srcAmount = params.amount;
            const dstAmount = (BigInt(params.amount) * BigInt(98) / BigInt(100)).toString(); // 2% slippage
            const rate = (BigInt(dstAmount) * BigInt(10000) / BigInt(srcAmount)).toString();
            
            return {
                srcAmount,
                dstAmount,
                rate,
                priceImpact: '0.5%',
                fee: '0.3%',
                timelock: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
            };
        } catch (error) {
            console.error('Error getting quote:', error);
            throw new Error(`Failed to get quote: ${error.message}`);
        }
    }

    async withdraw(orderHash: string, secret: string, chainId: number): Promise<{
        success: boolean;
        txHash?: string;
        message: string;
    }> {
        const order = this.orders.get(orderHash);
        if (!order) {
            throw new Error('Order not found');
        }

        // Verify secret
        if (ethers.keccak256(secret) !== order.hashLock) {
            throw new Error('Invalid secret');
        }

        // TODO: Implement actual withdrawal logic
        return {
            success: true,
            message: 'Withdrawal completed (simulated)'
        };
    }

    async cancel(orderHash: string, chainId: number): Promise<{
        success: boolean;
        txHash?: string;
        message: string;
    }> {
        const order = this.orders.get(orderHash);
        if (!order) {
            throw new Error('Order not found');
        }

        if (Date.now() / 1000 < order.timelock) {
            throw new Error('Cannot cancel before timelock expires');
        }

        // TODO: Implement actual cancellation logic
        order.status = 'cancelled';
        this.orders.set(orderHash, order);

        return {
            success: true,
            message: 'Order cancelled successfully (simulated)'
        };
    }

    async getStatus(): Promise<{
        status: string;
        supportedChains: string[];
        activeOrders: number;
        version: string;
    }> {
        return {
            status: 'operational',
            supportedChains: this.chains.map(c => c.name),
            activeOrders: Array.from(this.orders.values()).filter(o => o.status === 'pending' || o.status === 'executed').length,
            version: '1.0.0'
        };
    }
} 