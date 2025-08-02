'use client';

import { useState } from 'react';

// Chain configurations
const CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: 'bg-blue-500',
    type: 'EVM'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬟',
    color: 'bg-purple-500',
    type: 'EVM'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    color: 'bg-orange-500',
    type: 'NON-EVM'
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    color: 'bg-green-500',
    type: 'NON-EVM'
  }
];

// Token configurations
const TOKENS = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', balance: '2.45' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', balance: '1,250.00' },
    { symbol: 'USDT', name: 'Tether', icon: '₮', balance: '890.50' }
  ],
  bitcoin: [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', balance: '0.12' }
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: '⬟', balance: '450.00' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', balance: '750.00' }
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', icon: '◎', balance: '15.30' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', balance: '500.00' }
  ]
};

interface SwapState {
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destinationChain: string;
  destinationToken: string;
  destinationAmount: string;
  beneficiaryAddress: string;
}

export default function SwapComponent() {
  const [swapState, setSwapState] = useState<SwapState>({
    sourceChain: 'ethereum',
    sourceToken: 'ETH',
    sourceAmount: '',
    destinationChain: 'bitcoin',
    destinationToken: 'BTC',
    destinationAmount: '',
    beneficiaryAddress: ''
  });

  const [showSourceChainDropdown, setShowSourceChainDropdown] = useState(false);
  const [showSourceTokenDropdown, setShowSourceTokenDropdown] = useState(false);
  const [showDestChainDropdown, setShowDestChainDropdown] = useState(false);
  const [showDestTokenDropdown, setShowDestTokenDropdown] = useState(false);

  const sourceChainInfo = CHAINS.find(chain => chain.id === swapState.sourceChain);
  const destChainInfo = CHAINS.find(chain => chain.id === swapState.destinationChain);
  const sourceTokens = TOKENS[swapState.sourceChain as keyof typeof TOKENS] || [];
  const destTokens = TOKENS[swapState.destinationChain as keyof typeof TOKENS] || [];
  const sourceTokenInfo = sourceTokens.find(token => token.symbol === swapState.sourceToken);
  const destTokenInfo = destTokens.find(token => token.symbol === swapState.destinationToken);

  const handleSwapDirection = () => {
    setSwapState(prev => ({
      ...prev,
      sourceChain: prev.destinationChain,
      sourceToken: prev.destinationToken,
      sourceAmount: prev.destinationAmount,
      destinationChain: prev.sourceChain,
      destinationToken: prev.sourceToken,
      destinationAmount: prev.sourceAmount
    }));
  };

  const updateSwapState = (field: keyof SwapState, value: string) => {
    setSwapState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Atomic Swap</h2>
        <div className="text-sm text-gray-500">⚙️</div>
      </div>
      
      <p className="text-gray-600 text-sm mb-8">
        Exchange tokens across different blockchains securely
      </p>

      {/* From Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
        
        {/* Chain and Token Selection */}
        <div className="flex gap-2 mb-3">
          {/* Chain Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowSourceChainDropdown(!showSourceChainDropdown)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{sourceChainInfo?.icon}</span>
                <span className="font-medium text-gray-800">{sourceChainInfo?.name}</span>
                <span className="ml-2 px-2 py-1 bg-gray-200 text-xs rounded text-gray-600">
                  {sourceChainInfo?.type}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSourceChainDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                {CHAINS.map(chain => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      updateSwapState('sourceChain', chain.id);
                      updateSwapState('sourceToken', TOKENS[chain.id as keyof typeof TOKENS]?.[0]?.symbol || '');
                      setShowSourceChainDropdown(false);
                    }}
                    className="w-full p-3 flex items-center hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="text-lg mr-3">{chain.icon}</span>
                    <span className="font-medium text-gray-800">{chain.name}</span>
                    <span className="ml-auto px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                      {chain.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Token Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSourceTokenDropdown(!showSourceTokenDropdown)}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center hover:bg-gray-100 transition-colors min-w-[100px]"
            >
              <span className="text-lg mr-2">{sourceTokenInfo?.icon}</span>
              <span className="font-medium text-gray-800">{swapState.sourceToken}</span>
              <svg className="w-4 h-4 text-gray-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSourceTokenDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[200px]">
                {sourceTokens.map(token => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      updateSwapState('sourceToken', token.symbol);
                      setShowSourceTokenDropdown(false);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{token.icon}</span>
                      <span className="font-medium text-gray-800">{token.symbol}</span>
                    </div>
                    <span className="text-sm text-gray-500">{token.balance}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="0.0"
            value={swapState.sourceAmount}
            onChange={(e) => updateSwapState('sourceAmount', e.target.value)}
            className="bg-transparent text-2xl font-semibold outline-none flex-1 text-gray-800"
          />
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Balance: {sourceTokenInfo?.balance} {swapState.sourceToken}
            </div>
            <button className="text-green-600 text-sm font-medium hover:text-green-700 transition-colors">
              Max
            </button>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapDirection}
          className="bg-white border-2 border-gray-200 p-3 rounded-full hover:border-green-300 hover:bg-green-50 transition-colors shadow-sm"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
        
        {/* Chain and Token Selection */}
        <div className="flex gap-2 mb-3">
          {/* Chain Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDestChainDropdown(!showDestChainDropdown)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{destChainInfo?.icon}</span>
                <span className="font-medium text-gray-800">{destChainInfo?.name}</span>
                <span className="ml-2 px-2 py-1 bg-gray-200 text-xs rounded text-gray-600">
                  {destChainInfo?.type}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDestChainDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                {CHAINS.map(chain => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      updateSwapState('destinationChain', chain.id);
                      updateSwapState('destinationToken', TOKENS[chain.id as keyof typeof TOKENS]?.[0]?.symbol || '');
                      setShowDestChainDropdown(false);
                    }}
                    className="w-full p-3 flex items-center hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="text-lg mr-3">{chain.icon}</span>
                    <span className="font-medium text-gray-800">{chain.name}</span>
                    <span className="ml-auto px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                      {chain.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Token Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDestTokenDropdown(!showDestTokenDropdown)}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center hover:bg-gray-100 transition-colors min-w-[100px]"
            >
              <span className="text-lg mr-2">{destTokenInfo?.icon}</span>
              <span className="font-medium text-gray-800">{swapState.destinationToken}</span>
              <svg className="w-4 h-4 text-gray-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDestTokenDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[200px]">
                {destTokens.map(token => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      updateSwapState('destinationToken', token.symbol);
                      setShowDestTokenDropdown(false);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{token.icon}</span>
                      <span className="font-medium text-gray-800">{token.symbol}</span>
                    </div>
                    <span className="text-sm text-gray-500">{token.balance}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="0.0"
            value={swapState.destinationAmount}
            onChange={(e) => updateSwapState('destinationAmount', e.target.value)}
            className="bg-transparent text-2xl font-semibold outline-none flex-1 text-gray-800"
          />
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Balance: {destTokenInfo?.balance} {swapState.destinationToken}
            </div>
          </div>
        </div>
      </div>

      {/* Beneficiary Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beneficiary Address (Recipient)
        </label>
        <input
          type="text"
          placeholder="Enter destination wallet address"
          value={swapState.beneficiaryAddress}
          onChange={(e) => updateSwapState('beneficiaryAddress', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-green-500 focus:bg-white transition-colors text-gray-800"
        />
      </div>

      {/* Exchange Information */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Exchange Rate</span>
          <span className="font-medium text-gray-800">1 ETH = 15.2 BTC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estimated Time
          </span>
          <span className="font-medium text-gray-800">15-30 minutes</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Network Fee</span>
          <span className="font-medium text-gray-800">~$12.50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Protocol Fee</span>
          <span className="font-medium text-gray-800">0.1%</span>
        </div>
      </div>

      {/* Atomic Swap Protection Notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-0.5">🔒</div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Atomic Swap Protection</h4>
            <p className="text-sm text-blue-700">
              This swap uses Hash Time-Locked Contracts (HTLCs) to ensure either both parties receive their tokens or both get refunded.
            </p>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={!swapState.sourceAmount || !swapState.beneficiaryAddress}
      >
        Initiate Atomic Swap
      </button>
    </div>
  );
}