import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent drop-shadow-lg">
                🍃 Swap.Garden
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <span className="text-white/70 px-3 py-2 rounded-md text-sm font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

            {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-banner.png"
            alt="Swap Garden - Cross-chain cryptocurrency swapping platform"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent drop-shadow-lg">
                  One garden. Every chain.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
                Trustless atomic swaps across DeFi ecosystems.
              </p>
              
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full mb-8">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white font-semibold text-lg">Coming Soon</span>
              </div>
            </div>

            {/* Right Side - Disabled Swap Interface */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md w-full relative glass">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                <div className="relative opacity-70">
                  <h3 className="text-lg font-semibold text-white mb-6 text-center drop-shadow-md">Cross-Chain Swap</h3>
                  
                  {/* From Token */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">From</label>
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex items-center justify-between glass">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500/80 backdrop-blur-sm rounded-full mr-3 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          ETH
                        </div>
                        <span className="font-medium text-white/90 drop-shadow-sm">Ethereum</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="0.0" 
                        className="bg-transparent text-right text-lg font-medium outline-none w-20 text-white/80 placeholder-white/50"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/15 backdrop-blur-lg border border-white/30 p-3 rounded-full glass shadow-lg">
                      <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </div>

                  {/* To Token */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2 drop-shadow-sm">To</label>
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex items-center justify-between glass">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-500/80 backdrop-blur-sm rounded-full mr-3 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          BTC
                        </div>
                        <span className="font-medium text-white/90 drop-shadow-sm">Bitcoin</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="0.0" 
                        className="bg-transparent text-right text-lg font-medium outline-none w-20 text-white/80 placeholder-white/50"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Disabled Swap Button */}
                  <button 
                    className="w-full bg-white/5 backdrop-blur-lg border border-white/20 text-white/60 py-4 rounded-xl font-semibold text-lg cursor-not-allowed glass shadow-lg"
                    disabled
                  >
                    Swap (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
