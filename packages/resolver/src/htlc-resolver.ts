import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

// HTLC Factory ABI - minimal interface for our operations
const HTLC_FACTORY_ABI = [
    "function deploySourceHTLC(bytes32 orderHash, address maker, address makerAsset, uint256 makingAmount, address takerAsset, uint256 takingAmount, bytes32 hashLock, uint256 timelock, uint256 dstChainId) external returns (address htlc)",
    "function deployDestinationHTLC(bytes32 orderHash, address taker, address makerAsset, uint256 makingAmount, address takerAsset, uint256 takingAmount, bytes32 hashLock, uint256 timelock, uint256 srcChainId) external returns (address htlc)",
    "function getSourceHTLC(bytes32 orderHash) external view returns (address)",
    "function getDestinationHTLC(bytes32 orderHash) external view returns (address)"
];

// HTLC Contract ABI - for withdraw and cancel operations
const HTLC_ABI = [
    "function withdraw(bytes32 secret) external",
    "function cancel() external", 
    "function getDetails() external view returns (tuple(bytes32 orderHash, address maker, address taker, address makerAsset, address takerAsset, uint256 makingAmount, uint256 takingAmount, bytes32 hashLock, uint256 timelock, uint8 state, uint256 srcChainId, uint256 dstChainId))",
    "event Withdrawn(bytes32 indexed orderHash, address indexed withdrawer, bytes32 secret)",
    "event Cancelled(bytes32 indexed orderHash, address indexed canceller)"
];

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
    srcHTLCAddress?: string;
    dstHTLCAddress?: string;
    srcTxHash?: string;
    dstTxHash?: string;
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
            rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
            htlcFactory: process.env.SEPOLIA_HTLC_FACTORY || '0xb89F0578D3C1Ddf9aEa843840445E05F1e9E242A',
            name: 'Sepolia'
        },
        {
            chainId: 80002, // Polygon Amoy
            rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
            htlcFactory: process.env.POLYGON_AMOY_HTLC_FACTORY || '0xb89F0578D3C1Ddf9aEa843840445E05F1e9E242A',
            name: 'Polygon Amoy'
        }
    ];

    private readonly tokens: Map<number, TokenConfig[]> = new Map([
        [11155111, [ // Sepolia
            {
                address: '0xb4E06750949B30B7A69DEa2FfD537C438Af44708',
                symbol: 'ROSE',
                name: 'Rose Token',
                decimals: 18
            }
        ]],
        [80002, [ // Polygon Amoy
            {
                address: '0x71F4091F883A265F164907e7a70Fb44be20a0CF3',
                symbol: 'TULIP',
                name: 'Tulip Token',
                decimals: 6
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
            console.log(`\n🚀 Executing swap order: ${orderHash}`);
            console.log(`📊 Details: ${order.srcAmount} tokens (${order.srcChainId}) → ${order.dstAmount} tokens (${order.dstChainId})`);

            // Step 1: Deploy source HTLC
            console.log(`📤 Step 1: Deploying source HTLC on chain ${order.srcChainId}...`);
            const srcProvider = this.providers.get(order.srcChainId);
            const srcWallet = this.resolverWallet.get(order.srcChainId);
            
            if (!srcProvider || !srcWallet) {
                throw new Error(`No provider/wallet configured for chain ${order.srcChainId}`);
            }

            const srcChain = this.chains.find(c => c.chainId === order.srcChainId);
            if (!srcChain?.htlcFactory) {
                throw new Error(`No factory address configured for chain ${order.srcChainId}`);
            }

            // First, we need to ensure the maker has approved the factory to spend their tokens
            console.log(`🔐 Step 1a: Preparing token approval for maker...`);
            
            // Create maker wallet to approve tokens (for demo - in production, maker would do this)
            const makerPrivateKey = process.env.MAKER_PRIVATE_KEY || process.env.RESOLVER_PRIVATE_KEY;
            if (!makerPrivateKey) {
                throw new Error('No MAKER_PRIVATE_KEY or RESOLVER_PRIVATE_KEY found');
            }
            console.log(`🔍 Debug: Using maker private key: ${makerPrivateKey.substring(0, 10)}...`);
            const makerWallet = new ethers.Wallet(makerPrivateKey, srcProvider);
            console.log(`🔍 Debug: Maker wallet address: ${await makerWallet.getAddress()}`);
            
            const srcTokenContract = new ethers.Contract(
                order.srcToken, 
                ["function approve(address spender, uint256 amount) external returns (bool)"],
                makerWallet
            );
            
            // Approve HTLC Factory to spend maker's tokens
            const approveTx = await srcTokenContract.approve(srcChain.htlcFactory, order.srcAmount, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('30', 'gwei')
            });
            console.log(`⏳ Token approval transaction: ${approveTx.hash}`);
            await approveTx.wait();
            console.log(`✅ Token approval completed!`);
            
            // Now use the maker wallet to deploy the source HTLC
            const srcFactory = new ethers.Contract(srcChain.htlcFactory, HTLC_FACTORY_ABI, makerWallet);
            
            // Debug timelock values
            const currentTime = Math.floor(Date.now() / 1000);
            const timeDiff = order.timelock - currentTime;
            console.log(`🔍 Debug timelock validation:`);
            console.log(`  Current time: ${currentTime} (${new Date(currentTime * 1000).toISOString()})`);
            console.log(`  Order timelock: ${order.timelock} (${new Date(order.timelock * 1000).toISOString()})`);
            console.log(`  Time difference: ${timeDiff} seconds (${timeDiff / 3600} hours)`);
            console.log(`  MIN_TIMELOCK: ${3600} seconds (1 hour)`);
            console.log(`  MAX_TIMELOCK: ${7 * 24 * 3600} seconds (7 days)`);
            
            const srcTx = await srcFactory.deploySourceHTLC(
                orderHash,
                order.maker,
                order.srcToken,
                order.srcAmount,
                order.dstToken,
                order.dstAmount,
                order.hashLock,
                order.timelock,
                order.dstChainId,
                {
                    gasLimit: 800000, // Reduced gas limit
                    gasPrice: ethers.parseUnits('30', 'gwei') // Higher gas price to meet minimum
                }
            );
            
            console.log(`⏳ Source HTLC deployment transaction: ${srcTx.hash}`);
            const srcReceipt = await srcTx.wait();
            console.log(`✅ Source HTLC deployed! Gas used: ${srcReceipt.gasUsed.toString()}`);

            // Get the deployed HTLC address
            const srcHTLCAddress = await srcFactory.getSourceHTLC(orderHash);
            console.log(`📍 Source HTLC address: ${srcHTLCAddress}`);

            // Step 2: Deploy destination HTLC  
            console.log(`📥 Step 2: Deploying destination HTLC on chain ${order.dstChainId}...`);
            const dstProvider = this.providers.get(order.dstChainId);
            const dstWallet = this.resolverWallet.get(order.dstChainId);
            
            if (!dstProvider || !dstWallet) {
                throw new Error(`No provider/wallet configured for chain ${order.dstChainId}`);
            }

            const dstChain = this.chains.find(c => c.chainId === order.dstChainId);
            if (!dstChain?.htlcFactory) {
                throw new Error(`No factory address configured for chain ${order.dstChainId}`);
            }

            // Approve destination tokens for the taker (destination HTLC needs takerAsset approval)
            console.log(`🔐 Step 2a: Preparing token approval for taker...`);
            
            // Create taker wallet to approve tokens (for demo - in production, taker would do this)
            const takerPrivateKey = process.env.TAKER_PRIVATE_KEY || process.env.RESOLVER_PRIVATE_KEY;
            if (!takerPrivateKey) {
                throw new Error('No TAKER_PRIVATE_KEY or RESOLVER_PRIVATE_KEY found');
            }
            console.log(`🔍 Debug: Using taker private key: ${takerPrivateKey.substring(0, 10)}...`);
            const takerWallet = new ethers.Wallet(takerPrivateKey, dstProvider);
            console.log(`🔍 Debug: Taker wallet address: ${await takerWallet.getAddress()}`);
            
            const dstTokenContract = new ethers.Contract(
                order.dstToken, 
                ["function approve(address spender, uint256 amount) external returns (bool)"],
                takerWallet
            );
            
            // Approve HTLC Factory to spend taker's tokens
            const dstApproveTx = await dstTokenContract.approve(dstChain.htlcFactory, order.dstAmount, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('15', 'gwei')
            });
            console.log(`⏳ Destination token approval transaction: ${dstApproveTx.hash}`);
            await dstApproveTx.wait();
            console.log(`✅ Destination token approval completed!`);
            
            // Now use the taker wallet to deploy the destination HTLC
            const dstFactory = new ethers.Contract(dstChain.htlcFactory, HTLC_FACTORY_ABI, takerWallet);
            
            const dstTx = await dstFactory.deployDestinationHTLC(
                orderHash,
                await takerWallet.getAddress(), // use the actual taker address
                order.srcToken,
                order.srcAmount,
                order.dstToken,
                order.dstAmount,
                order.hashLock,
                order.timelock,
                order.srcChainId,
                {
                    gasLimit: 800000, // Reduced gas limit
                    gasPrice: ethers.parseUnits('15', 'gwei') // Higher gas price for Sepolia
                }
            );
            
            console.log(`⏳ Destination HTLC deployment transaction: ${dstTx.hash}`);
            const dstReceipt = await dstTx.wait();
            console.log(`✅ Destination HTLC deployed! Gas used: ${dstReceipt.gasUsed.toString()}`);

            // Get the deployed HTLC address
            const dstHTLCAddress = await dstFactory.getDestinationHTLC(orderHash);
            console.log(`📍 Destination HTLC address: ${dstHTLCAddress}`);
            
            // Update order with transaction details
            order.status = 'executed';
            order.srcTxHash = srcReceipt.hash;
            order.dstTxHash = dstReceipt.hash;
            order.srcHTLCAddress = srcHTLCAddress;
            order.dstHTLCAddress = dstHTLCAddress;
            this.orders.set(orderHash, order);
            
            console.log(`🎉 Swap execution completed successfully!`);
            return {
                success: true,
                srcTxHash: srcReceipt.hash,
                dstTxHash: dstReceipt.hash,
                message: 'HTLCs deployed successfully on both chains'
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
            
            // Use relative timelock (2 hours from current time)
            const currentTime = Math.floor(Date.now() / 1000);
            const reasonableTimelock = currentTime + (2 * 60 * 60); // 2 hours from now
            
            return {
                srcAmount,
                dstAmount,
                rate,
                priceImpact: '0.5%',
                fee: '0.3%',
                timelock: reasonableTimelock
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

        try {
            console.log(`\n💸 Withdrawing from HTLC on chain ${chainId}...`);
            
            const provider = this.providers.get(chainId);
            const wallet = this.resolverWallet.get(chainId);
            
            if (!provider || !wallet) {
                throw new Error(`No provider/wallet configured for chain ${chainId}`);
            }

            // Determine which HTLC to withdraw from
            const htlcAddress = chainId === order.srcChainId ? order.srcHTLCAddress : order.dstHTLCAddress;
            if (!htlcAddress) {
                throw new Error(`No HTLC address found for chain ${chainId}`);
            }

            console.log(`📍 Withdrawing from HTLC: ${htlcAddress}`);
            
            const htlcContract = new ethers.Contract(htlcAddress, HTLC_ABI, wallet);
            
            const withdrawTx = await htlcContract.withdraw(secret, {
                gasLimit: 500000
            });
            
            console.log(`⏳ Withdrawal transaction: ${withdrawTx.hash}`);
            const withdrawReceipt = await withdrawTx.wait();
            console.log(`✅ Withdrawal completed! Gas used: ${withdrawReceipt.gasUsed.toString()}`);

            return {
                success: true,
                txHash: withdrawReceipt.hash,
                message: `Withdrawal completed on chain ${chainId}`
            };
        } catch (error) {
            console.error('Withdrawal error:', error);
            throw new Error(`Failed to withdraw: ${error.message}`);
        }
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

        try {
            console.log(`\n❌ Cancelling HTLC on chain ${chainId}...`);
            
            const provider = this.providers.get(chainId);
            const wallet = this.resolverWallet.get(chainId);
            
            if (!provider || !wallet) {
                throw new Error(`No provider/wallet configured for chain ${chainId}`);
            }

            const htlcAddress = chainId === order.srcChainId ? order.srcHTLCAddress : order.dstHTLCAddress;
            if (!htlcAddress) {
                throw new Error(`No HTLC address found for chain ${chainId}`);
            }

            console.log(`📍 Cancelling HTLC: ${htlcAddress}`);
            
            const htlcContract = new ethers.Contract(htlcAddress, HTLC_ABI, wallet);
            
            const cancelTx = await htlcContract.cancel({
                gasLimit: 500000
            });
            
            console.log(`⏳ Cancellation transaction: ${cancelTx.hash}`);
            const cancelReceipt = await cancelTx.wait();
            console.log(`✅ Cancellation completed! Gas used: ${cancelReceipt.gasUsed.toString()}`);

            // Update order status
            order.status = 'cancelled';
            this.orders.set(orderHash, order);

            return {
                success: true,
                txHash: cancelReceipt.hash,
                message: `Order cancelled on chain ${chainId}`
            };
        } catch (error) {
            console.error('Cancellation error:', error);
            throw new Error(`Failed to cancel: ${error.message}`);
        }
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