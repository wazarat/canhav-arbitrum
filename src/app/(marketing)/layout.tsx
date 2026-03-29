import type { Metadata } from "next";
import "./marketing.css";

export const metadata: Metadata = {
  title: "CanHav | Group Purchasing for Small Businesses in the GTA",
  description:
    "Stop overpaying for supplies. CanHav groups small businesses across the GTA into buying pools so you get wholesale pricing normally reserved for large chains. Free to join.",
  openGraph: {
    title: "CanHav | Group Purchasing for Small Businesses",
    description:
      "Get the wholesale pricing normally reserved for chains. CanHav groups GTA small businesses into buying pools. Free to join, 100% refund if the pool does not fill.",
    type: "website",
    locale: "en_CA",
    siteName: "CanHav",
  },
  twitter: {
    card: "summary_large_image",
    title: "CanHav | Group Purchasing for Small Businesses",
    description:
      "Get wholesale pricing by buying together with other GTA small businesses. Free to join, 100% refund if the pool does not fill.",
  },
  icons: {
    icon: "/ch-logo.svg",
  },
  alternates: {
    canonical: "https://canhav.co",
  },
};

function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "CanHav",
    description:
      "Group purchasing platform for small businesses in the Greater Toronto Area. Pool buying power to get wholesale pricing on essential supplies.",
    url: "https://canhav.co",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 43.6532,
        longitude: -79.3832,
      },
      geoRadius: "80000",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
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
      <LocalBusinessJsonLd />
      {children}
    </>
  );
}
