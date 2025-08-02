"use client";
import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "@/contexts/Web3AuthContext";
import { Toaster } from "@/components/ui/sonner"

import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider>
        {children}
        <Toaster />
      </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
