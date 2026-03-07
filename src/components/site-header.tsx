"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";
import { useOwner } from "@/lib/hooks";

function NavLinks({
  isOwner,
  onClick,
}: {
  isOwner: boolean;
  onClick?: () => void;
}) {
  return (
    <>
      <Link
        href="/pools"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Pools
      </Link>
      <Link
        href="/my-commitments"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        My Commitments
      </Link>
      <Link
        href="/request-pool"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Request a Pool
      </Link>
      {isOwner && (
        <Link
          href="/admin"
          onClick={onClick}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Admin
        </Link>
      )}
    </>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address } = useAccount();
  const { data: owner } = useOwner();

  const isOwner =
    !!owner &&
    !!address &&
    owner.toString().toLowerCase() === address.toLowerCase();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/canhav-logo.svg"
              alt="CanHav Group Pool"
              width={140}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <NavLinks isOwner={isOwner} />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ConnectButton />
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-3 border-t px-4 py-4 text-sm sm:hidden">
          <NavLinks
            isOwner={isOwner}
            onClick={() => setMobileOpen(false)}
          />
        </nav>
      )}
    </header>
  );
}
