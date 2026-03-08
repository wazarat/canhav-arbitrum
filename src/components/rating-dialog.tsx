"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/star-rating";

interface RatingData {
  avgRating: number;
  count: number;
  userRating: { rating: number; comment: string } | null;
}

function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="text-2xl transition-colors focus:outline-none"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <span className={star <= (hover || value) ? "text-yellow-400" : "text-muted-foreground/30"}>
            &#9733;
          </span>
        </button>
      ))}
    </div>
  );
}

export function RatingDialog({
  poolId,
  productName,
}: {
  poolId: number;
  productName: string;
}) {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<RatingData | null>(null);

  const fetchRating = useCallback(async () => {
    try {
      const params = new URLSearchParams({ poolId: String(poolId) });
      if (address) params.set("address", address);
      const res = await fetch(`/api/ratings?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    }
  }, [poolId, address]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  async function handleSubmit() {
    if (rating === 0 || !address) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, address, rating, comment }),
      });
      if (res.ok) {
        toast.success("Rating submitted. Thank you!");
        setOpen(false);
        fetchRating();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit rating");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyRated = !!data?.userRating;

  return (
    <div className="space-y-3">
      {/* Aggregate rating display */}
      {data && data.count > 0 && (
        <div className="flex items-center gap-3">
          <StarRating rating={data.avgRating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({data.count} {data.count === 1 ? "rating" : "ratings"})
          </span>
        </div>
      )}

      {alreadyRated ? (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm">
          <p className="font-medium text-green-400">You rated this order</p>
          <div className="mt-1">
            <StarRating rating={data!.userRating!.rating} size="sm" />
          </div>
          {data!.userRating!.comment && (
            <p className="text-xs text-muted-foreground mt-1">
              &ldquo;{data!.userRating!.comment}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="w-full" />
            }
          >
            Rate This Order
          </DialogTrigger>

          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Rate Your Order</DialogTitle>
              <DialogDescription>
                How was your experience with {productName}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your rating</Label>
                <InteractiveStars value={rating} onChange={setRating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating-comment">Comment (optional)</Label>
                <Textarea
                  id="rating-comment"
                  placeholder="Tell us about the product quality, delivery, etc."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
