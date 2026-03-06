"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono text-lg font-bold tracking-tight">
            GroupBuy
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link
              href="/pools"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pools
            </Link>
            <Link
              href="/my-commitments"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              My Commitments
            </Link>
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
