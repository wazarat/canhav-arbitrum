"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Link as LinkIcon, RefreshCw } from "lucide-react";

export function ConnectButton() {
  const { ready, authenticated, login, logout, linkWallet, user } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
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

  const currentIsEmbedded = wallets.find(
    (w) => w.address?.toLowerCase() === address?.toLowerCase()
  )?.walletClientType === "privy";

  const externalWallet = wallets.find(
    (w) => w.walletClientType !== "privy"
  );

  const canSwitchToExternal = currentIsEmbedded && externalWallet;

  async function handleSwitchToExternal() {
    if (externalWallet) {
      await setActiveWallet(externalWallet);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {address && (
        <span className={`hidden sm:inline rounded-lg px-3 py-1.5 font-mono text-xs ${
          currentIsEmbedded
            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
            : "bg-primary/10 border border-primary/20 text-primary"
        }`}>
          {address.slice(0, 6)}...{address.slice(-4)}
          {currentIsEmbedded && (
            <span className="ml-1.5 text-[10px] opacity-70">(embedded)</span>
          )}
        </span>
      )}

      {displayEmail && !address && (
        <span className="hidden sm:inline rounded-lg bg-muted px-3 py-1.5 text-xs truncate max-w-[160px]">
          {displayEmail}
        </span>
      )}

      {canSwitchToExternal && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchToExternal}
          title={`Switch to MetaMask (${externalWallet.address.slice(0, 6)}...${externalWallet.address.slice(-4)})`}
          className="border-amber-500/30 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Switch to MetaMask</span>
          <Wallet className="h-3 w-3 sm:hidden" />
        </Button>
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

      {hasExternalWallet && !externalWallet && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => linkWallet()}
          title="Reconnect your external wallet"
          className="border-amber-500/30 text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5"
        >
          <Wallet className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Reconnect Wallet</span>
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
