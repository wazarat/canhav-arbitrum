"use client";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = true,
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={`flex items-center gap-1.5 ${sizeClass}`}>
      <div className="flex">
        {Array.from({ length: max }, (_, i) => {
          const filled = rating - i;
          if (filled >= 1) {
            return <span key={i} className="text-yellow-400">&#9733;</span>;
          }
          if (filled >= 0.5) {
            return (
              <span key={i} className="relative">
                <span className="text-muted-foreground/30">&#9733;</span>
                <span className="absolute inset-0 overflow-hidden w-[50%] text-yellow-400">&#9733;</span>
              </span>
            );
          }
          return <span key={i} className="text-muted-foreground/30">&#9733;</span>;
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
