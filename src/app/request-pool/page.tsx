"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RequestPoolPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !quantity.trim() || !contact.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast.success("Pool request submitted!");
    }, 600);
  }

  if (submitted) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Request Received</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you! We&apos;ll review your request and get back to you soon.
          Once approved, the pool will appear on the platform for others to join.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/pools" className={cn(buttonVariants({ variant: "outline" }))}>
            Browse Pools
          </Link>
          <Button onClick={() => { setSubmitted(false); setProduct(""); setQuantity(""); setPriceRange(""); setContact(""); setNotes(""); }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/pools"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to pools
        </Link>
        <h1 className="text-2xl font-bold mt-2">Request a Pool</h1>
        <p className="text-muted-foreground mt-1">
          Have a product you&apos;d like to group-buy? Submit your request and
          we&apos;ll evaluate it for the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pool Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product"
                placeholder="e.g. Colombian Dark Roast Coffee"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Estimated Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                placeholder="e.g. 200 units"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Preferred Price Range</Label>
              <Input
                id="priceRange"
                placeholder="e.g. $8 - $12 per unit"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">
                Contact (email or wallet address){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact"
                placeholder="you@example.com or 0x..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any details about sourcing, preferred suppliers, timeline, etc."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
