'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { toast } from "sonner";

// Chain configurations for display
const CHAIN_INFO: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
  137: { name: 'Polygon', icon: '⬟', color: 'bg-purple-500' },
  11155111: { name: 'Sepolia', icon: '⟠', color: 'bg-blue-400' },
  80002: { name: 'Polygon Amoy', icon: '⬟', color: 'bg-purple-400' },
  10143: { name: 'Monad Testnet', icon: '⚪️', color: 'bg-purple-400' },
};

interface ConnectedWalletCardProps {
  address: string;
  connectorName: string;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  disconnectError?: Error | null;
}

function ConnectedWalletCard({ 
  address, 
  connectorName, 
  onDisconnect, 
  isDisconnecting, 
  disconnectError 
}: ConnectedWalletCardProps) {
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNetworkDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const currentChain = CHAIN_INFO[chainId] || { name: `Chain ${chainId}`, icon: '🔗', color: 'bg-gray-500' };
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleNetworkSwitch = async (newChainId: number) => {
    try {
      await switchChain({ chainId: newChainId });
      const chainInfo = CHAIN_INFO[newChainId];
      toast.success(`Switched to ${chainInfo?.name || `Chain ${newChainId}`}`);
      setShowNetworkDropdown(false);
    } catch {
      toast.error('Failed to switch network');
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20 w-[320px] animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600">Connected</span>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {connectorName}
        </div>
      </div>

      {/* Network Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Network</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200 group"
            >
              <span className="text-lg">{currentChain.icon}</span>
              <span className="text-sm font-medium text-gray-800">{currentChain.name}</span>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showNetworkDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Network Dropdown */}
            {showNetworkDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[200px] overflow-hidden">
                {chains.map((chain) => {
                  const chainInfo = CHAIN_INFO[chain.id] || { name: chain.name, icon: '🔗', color: 'bg-gray-500' };
                  const isActive = chainId === chain.id;
                  
                  return (
                    <button
                      key={chain.id}
                      onClick={() => handleNetworkSwitch(chain.id)}
                      disabled={isActive}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isActive ? 'bg-green-50 text-green-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{chainInfo.icon}</span>
                      <span className="font-medium">{chainInfo.name}</span>
                      {isActive && (
                        <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Address</span>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono text-gray-800">
              {formatAddress(address)}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast.success('Address copied to clipboard');
              }}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy address"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={onDisconnect}
        disabled={isDisconnecting}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isDisconnecting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Disconnecting...</span>
          </div>
        ) : (
          'Disconnect Wallet'
        )}
      </button>

      {disconnectError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{disconnectError.message}</p>
        </div>
      )}
    </div>
  );
}

interface ConnectWalletButtonProps {
  onConnect: () => void;
  isConnecting: boolean;
}

function ConnectWalletButton({ onConnect, isConnecting }: ConnectWalletButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="shimmer opacity-30"></div>
        </div>
        
        <div className="relative flex items-center space-x-3">
          {isConnecting ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span className="text-lg animate-float">🍃</span>
              <span>Connect Wallet</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </div>
      </button>
    </div>
  );
}

interface WalletButtonProps {
  address: string;
  onClick: () => void;
  isConnecting?: boolean;
}

function WalletButton({ address, onClick, isConnecting }: WalletButtonProps) {
  const chainId = useChainId();
  const currentChain = CHAIN_INFO[chainId] || { name: `Chain ${chainId}`, icon: '🔗', color: 'bg-gray-500' };
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className="flex items-center space-x-2 bg-white/90 hover:bg-white border border-white/20 hover:border-green-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm group"
    >
      {/* Connection Status */}
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      
      {/* Network Icon */}
      <span className="text-sm">{currentChain.icon}</span>
      
      {/* Address */}
      <code className="text-sm font-mono text-gray-700 group-hover:text-green-600 transition-colors">
        {formatAddress(address)}
      </code>
      
      {/* Dropdown Arrow */}
      <svg className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export default function WalletConnection() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { address } = useAccount();
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setShowDropdown(false);
    }
  }, [isConnected]);

  // Handle connection success/error
  useEffect(() => {
    if (isConnected && address && !connectLoading) {
      toast.success('Wallet connected successfully!');
    }
  }, [isConnected, address, connectLoading]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      toast.error(`Connection failed: ${connectError.message}`);
    }
  }, [connectError]);

  // Handle disconnect errors
  useEffect(() => {
    if (disconnectError) {
      toast.error(`Disconnect failed: ${disconnectError.message}`);
    }
  }, [disconnectError]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.info('Wallet disconnected');
      setShowDropdown(false);
    } catch {
      // Error handling is done in useEffect above
    }
  };

  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <WalletButton
          address={address}
          onClick={() => setShowDropdown(!showDropdown)}
          isConnecting={connectLoading}
        />
        
        {/* Dropdown Card */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 z-50">
            <ConnectedWalletCard
              address={address}
              connectorName={connectorName || 'Unknown'}
              onDisconnect={handleDisconnect}
              isDisconnecting={disconnectLoading}
              disconnectError={disconnectError}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <ConnectWalletButton
      onConnect={connect}
      isConnecting={connectLoading}
    />
  );
}