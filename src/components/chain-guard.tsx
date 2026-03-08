"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function useChainReady() {
  const { chain } = useAccount();
  return chain?.id === arbitrumSepolia.id;
}

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return <>{children}</>;

  const isWrongChain = chain && chain.id !== arbitrumSepolia.id;

  if (isWrongChain) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          Wrong Network
        </div>
        <p className="text-xs text-muted-foreground">
          Your wallet is connected to <strong>{chain.name}</strong> (ID: {chain.id}).
          This app requires <strong>Arbitrum Sepolia</strong>.
        </p>
        <Button
          size="sm"
          onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
          disabled={isPending}
          className="gradient-brand border-0 text-white hover:opacity-90 transition-opacity"
        >
          {isPending ? "Switching..." : "Switch to Arbitrum Sepolia"}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
