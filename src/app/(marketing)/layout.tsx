import type { Metadata } from "next";
import "./marketing.css";

export const metadata: Metadata = {
  title: "CanHav | On-chain & off-chain intelligence for web3 research",
  description:
    "Research blockchain ecosystems with on-chain and off-chain data that goes beyond dashboards. Trade, invest, or train AI agents on a unified intelligence platform. Join the waitlist.",
  openGraph: {
    title: "CanHav | Web3 research intelligence",
    description:
      "On-chain and off-chain data for researchers and practitioners. Join the waitlist for early access.",
    type: "website",
    locale: "en_US",
    siteName: "CanHav",
  },
  twitter: {
    card: "summary_large_image",
    title: "CanHav | Web3 research intelligence",
    description:
      "On-chain and off-chain data for researchers and practitioners. Join the waitlist for early access.",
  },
  icons: {
    icon: "/ch-logo.svg",
  },
  alternates: {
    canonical: "https://canhav.co",
  },
};

function ProductJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CanHav",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Intelligence platform for web3 researchers and practitioners combining on-chain and off-chain data for trading, investing, and AI agent training.",
    url: "https://canhav.co",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd />
      {children}
    </>
  );
}
