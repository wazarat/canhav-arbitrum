"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";
import { useOwner } from "@/lib/hooks";

const NAV_ITEMS = [
  { href: "/pools", label: "Pools" },
  { href: "/my-commitments", label: "My Commitments" },
  { href: "/request-pool", label: "Request a Pool" },
] as const;

function NavLinks({
  isOwner,
  onClick,
}: {
  isOwner: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`relative py-1 font-medium transition-colors ${
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute -bottom-[19px] left-0 right-0 h-[2px] gradient-brand rounded-full" />
            )}
          </Link>
        );
      })}
      {isOwner && (
        <Link
          href="/admin"
          onClick={onClick}
          className={`relative py-1 font-medium transition-colors ${
            pathname.startsWith("/admin")
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Admin
          {pathname.startsWith("/admin") && (
            <span className="absolute -bottom-[19px] left-0 right-0 h-[2px] gradient-brand rounded-full" />
          )}
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
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/pools" className="flex items-center gap-2">
            <Image
              src="/canhav-logo.svg"
              alt="CanHav Group Pool"
              width={140}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
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

      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {mobileOpen && (
        <nav className="flex flex-col gap-3 px-4 py-4 text-sm sm:hidden bg-background/90 backdrop-blur-xl">
          <NavLinks
            isOwner={isOwner}
            onClick={() => setMobileOpen(false)}
          />
        </nav>
      )}
    </header>
  );
}
