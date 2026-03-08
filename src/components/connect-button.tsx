"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Link as LinkIcon } from "lucide-react";

export function ConnectButton() {
  const { ready, authenticated, login, logout, linkWallet, user } = usePrivy();
  const { address } = useAccount();

  if (!ready) {
    return (
      <Button size="sm" variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button size="sm" onClick={login} className="gradient-brand border-0 text-white hover:opacity-90 transition-opacity">
        Sign In
      </Button>
    );
  }

  const displayEmail = user?.email?.address;
  const hasExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet" && a.walletClientType !== "privy"
  );

  return (
    <div className="flex items-center gap-2">
      {address && (
        <span className="hidden sm:inline rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 font-mono text-xs text-primary">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}

      {displayEmail && !address && (
        <span className="hidden sm:inline rounded-lg bg-muted px-3 py-1.5 text-xs truncate max-w-[160px]">
          {displayEmail}
        </span>
      )}

      {!hasExternalWallet && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => linkWallet()}
          title="Link MetaMask or external wallet"
          className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
        >
          <Wallet className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Link Wallet</span>
          <LinkIcon className="h-3 w-3 sm:hidden" />
        </Button>
      )}

      <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
}
