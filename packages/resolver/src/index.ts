import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { HTLCResolver } from './htlc-resolver';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize HTLC Resolver
let htlcResolver: HTLCResolver;

try {
    htlcResolver = new HTLCResolver();
    console.log('HTLC Resolver initialized successfully');
} catch (error) {
    console.error('Failed to initialize HTLC Resolver:', error);
    process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'htlc-resolver' });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working', timestamp: Date.now() });
});

// Create cross-chain swap order
app.post('/swap/create', async (req, res) => {
    try {
        console.log('Received create swap request:', req.body);
        
        const {
            maker,
            srcChainId,
            dstChainId,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount,
            timelock
        } = req.body;

        // Validate request
        if (!maker || !srcChainId || !dstChainId || !srcToken || !dstToken || !srcAmount || !dstAmount) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        console.log('Creating swap order...');
        const swapOrder = await htlcResolver.createSwapOrder({
            maker,
            srcChainId,
            dstChainId,
            srcToken,
            dstToken,
            srcAmount,
            dstAmount,
            timelock: timelock || (Math.floor(Date.now() / 1000) + 24 * 60 * 60) // 24 hours default
        });

        console.log('Swap order created successfully:', swapOrder.orderHash);
        res.json(swapOrder);
    } catch (error: any) {
        console.error('Create swap error:', error);
        res.status(500).json({ 
            error: 'Failed to create swap order',
            details: error.message,
            stack: error.stack
        });
    }
});

// Execute cross-chain swap
app.post('/swap/execute', async (req, res) => {
    try {
        const { orderHash, makerSignature } = req.body;

        if (!orderHash || !makerSignature) {
            return res.status(400).json({
                error: 'Missing orderHash or makerSignature'
            });
        }

        const result = await htlcResolver.executeSwap(orderHash, makerSignature);
        res.json(result);
    } catch (error: any) {
        console.error('Execute swap error:', error);
        res.status(500).json({ error: 'Failed to execute swap' });
    }
});

// Get swap status
app.get('/swap/:orderHash/status', async (req, res) => {
    try {
        const { orderHash } = req.params;
        const status = await htlcResolver.getSwapStatus(orderHash);
        res.json(status);
    } catch (error: any) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get swap status' });
    }
});

// Get supported tokens for a chain
app.get('/tokens/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const tokens = await htlcResolver.getSupportedTokens(parseInt(chainId));
        res.json({ chainId, tokens });
    } catch (error: any) {
        console.error('Get tokens error:', error);
        res.status(500).json({ error: 'Failed to get supported tokens' });
    }
});

// Get quote for cross-chain swap
app.post('/quote', async (req, res) => {
    try {
        const { srcChainId, dstChainId, srcToken, dstToken, amount } = req.body;
        
        if (!srcChainId || !dstChainId || !srcToken || !dstToken || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields: srcChainId, dstChainId, srcToken, dstToken, amount' 
            });
        }

        const quote = await htlcResolver.getQuote({
            srcChainId,
            dstChainId,
            srcToken,
            dstToken,
            amount
        });

        res.json(quote);
    } catch (error: any) {
        console.error('Quote error:', error);
        res.status(500).json({ error: 'Failed to get quote' });
    }
});

// Withdraw from HTLC (for users)
app.post('/withdraw', async (req, res) => {
    try {
        const { orderHash, secret, chainId } = req.body;
        
        if (!orderHash || !secret || !chainId) {
            return res.status(400).json({
                error: 'Missing required fields: orderHash, secret, chainId'
            });
        }

        const result = await htlcResolver.withdraw(orderHash, secret, chainId);
        res.json(result);
    } catch (error: any) {
        console.error('Withdraw error:', error);
        res.status(500).json({ error: 'Failed to withdraw from HTLC' });
    }
});

// Cancel HTLC (after timelock)
app.post('/cancel', async (req, res) => {
    try {
        const { orderHash, chainId } = req.body;
        
        if (!orderHash || !chainId) {
            return res.status(400).json({
                error: 'Missing required fields: orderHash, chainId'
            });
        }

        const result = await htlcResolver.cancel(orderHash, chainId);
        res.json(result);
    } catch (error: any) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: 'Failed to cancel HTLC' });
    }
});

// Get resolver status
app.get('/status', async (req, res) => {
    try {
        const status = await htlcResolver.getStatus();
        res.json(status);
    } catch (error: any) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

app.listen(PORT, () => {
    console.log(`🔍 HTLC Resolver service running on port ${PORT}`);
}); 