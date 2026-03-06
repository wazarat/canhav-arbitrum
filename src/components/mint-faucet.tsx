"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mockUsdcConfig } from "@/lib/contracts";
import { useUsdcBalance } from "@/lib/hooks";
import { formatUsdc } from "@/lib/constants";

const MINT_AMOUNT = 10_000n * 10n ** 6n; // 10,000 mUSDC

export function MintFaucet() {
  const { address, isConnected } = useAccount();
  const { data: balance, refetch } = useUsdcBalance(address);

  const { writeContract, isPending, data: txHash } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  function handleMint() {
    writeContract(
      {
        ...mockUsdcConfig,
        functionName: "mint",
        args: [MINT_AMOUNT],
      },
      {
        onSuccess: () => {
          toast.success("Minted 10,000 mUSDC!");
          refetch();
        },
        onError: (err) => {
          toast.error(err.message.split("\n")[0] || "Mint failed");
        },
      },
    );
  }

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex-1 text-sm">
        <p className="font-medium">Test Token Faucet</p>
        {balance !== undefined && (
          <p className="text-muted-foreground text-xs">
            Balance: {formatUsdc(balance as bigint)} mUSDC
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleMint}
        disabled={isPending || isConfirming}
      >
        {isPending || isConfirming ? "Minting..." : "Mint 10,000 mUSDC"}
      </Button>
    </div>
  );
}
