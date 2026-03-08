"use client";

import { useEffect, useState } from "react";

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "Deadline passed";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export function Countdown({ deadline }: { deadline: bigint }) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Number(deadline) - Math.floor(Date.now() / 1000);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Number(deadline) - Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span>{formatTimeLeft(timeLeft)}</span>;
}
