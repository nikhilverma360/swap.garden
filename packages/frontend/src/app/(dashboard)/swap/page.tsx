"use client";
import SwapComponent from './components/SwapComponent';
import WalletConnection from './components/WalletConnection';
import Link from 'next/link';


export default function SwapPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🍃 Swap.Garden
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <span className="text-green-600 px-3 py-2 text-sm font-medium bg-green-100 rounded-full">
                  Swap
                </span>
              </div>
              
              {/* Wallet Connection */}
              <WalletConnection />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Cross-Chain Swap
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Trustless atomic swaps between different blockchain networks
            </p>
          </div>

          {/* Swap Component */}
          <div className="flex justify-center">
            <SwapComponent />
          </div>
        </div>
      </main>
    </div>
  );
}