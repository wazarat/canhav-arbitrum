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
      <Button size="sm" onClick={login}>
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
        <span className="hidden sm:inline rounded-md bg-muted px-3 py-1.5 font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}

      {displayEmail && !address && (
        <span className="hidden sm:inline rounded-md bg-muted px-3 py-1.5 text-xs truncate max-w-[160px]">
          {displayEmail}
        </span>
      )}

      {!hasExternalWallet && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => linkWallet()}
          title="Link MetaMask or external wallet"
        >
          <Wallet className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Link Wallet</span>
          <LinkIcon className="h-3 w-3 sm:hidden" />
        </Button>
      )}

      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
}
