"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FREQUENCIES = ["Once", "Weekly", "Monthly", "Not sure"] as const;

interface RegisterInterestDialogProps {
  productName: string;
  buttonVariant?: "default" | "outline";
  buttonSize?: "default" | "sm" | "lg";
  buttonClassName?: string;
  buttonLabel?: string;
}

export function RegisterInterestDialog({
  productName,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName = "w-full",
  buttonLabel = "Register Interest",
}: RegisterInterestDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [units, setUnits] = useState("");
  const [frequency, setFrequency] = useState<string>("");
  const [comments, setComments] = useState("");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Interest registered! We'll notify you when this pool launches.");
      setName("");
      setEmail("");
      setUnits("");
      setFrequency("");
      setComments("");
      setOpen(false);
    }, 500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={buttonVariant} size={buttonSize} className={buttonClassName} />}
      >
        {buttonLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Interest</DialogTitle>
          <DialogDescription>
            Get notified when <span className="font-medium text-foreground">{productName}</span> becomes
            available for pooling.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ri-name">Name</Label>
            <Input
              id="ri-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ri-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ri-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ri-units">How many units do you want?</Label>
            <Input
              id="ri-units"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>How often do you need this?</Label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(frequency === f ? "" : f)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    frequency === f
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ri-comments">
              Comments <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ri-comments"
              placeholder="Any specific requirements, preferred suppliers, etc."
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? "Submitting..." : "Notify Me"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
