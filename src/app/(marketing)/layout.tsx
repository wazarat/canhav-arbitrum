import type { Metadata } from "next";
import "./marketing.css";

export const metadata: Metadata = {
  title: "CanHav — Group Purchasing for Small Businesses in the GTA",
  description:
    "CanHav pools purchasing power across Toronto's small businesses. Join a buying group and save 15-40% on your essential supplies.",
  openGraph: {
    title: "CanHav — Group Purchasing for Small Businesses",
    description:
      "Save 15-40% on essential supplies by buying together with other GTA small businesses.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
