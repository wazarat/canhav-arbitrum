"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { arbitrumSepolia } from "viem/chains";
import { wagmiConfig } from "@/lib/wagmi-config";
import { ErrorBoundary } from "@/components/error-boundary";
import { type ReactNode, useState } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID || PRIVY_APP_ID === "REPLACE_WITH_YOUR_PRIVY_APP_ID") {
    return (
      <div className="flex items-center justify-center min-h-screen text-center p-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Privy App ID Required</h1>
          <p className="text-muted-foreground max-w-md">
            Set <code className="bg-muted px-1.5 py-0.5 rounded text-sm">NEXT_PUBLIC_PRIVY_APP_ID</code> in
            your <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.env.local</code> file.
            Create a free app at{" "}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              dashboard.privy.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
          logo: "/canhav-logo.svg",
        },
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
