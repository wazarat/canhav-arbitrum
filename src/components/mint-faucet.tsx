"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mockUsdcConfig } from "@/lib/contracts";
import { useUsdcBalance } from "@/lib/hooks";
import { useGasOverrides } from "@/lib/gas";
import { formatUsdc } from "@/lib/constants";
import { ChainGuard } from "@/components/chain-guard";

const MINT_AMOUNT = 10_000n * 10n ** 6n;

function friendlyError(err: Error): string {
  const msg = err.message || "";
  if (msg.includes("max fee per gas less than block base fee"))
    return "Gas fee too low — please try again (network fees fluctuated).";
  if (msg.includes("insufficient funds"))
    return "Your wallet needs ETH on Arbitrum Sepolia for gas fees.";
  if (msg.includes("User rejected") || msg.includes("user rejected"))
    return "Transaction cancelled.";
  if (msg.includes("chain mismatch") || msg.includes("does not match"))
    return "Wrong network — switch to Arbitrum Sepolia in your wallet.";
  return msg.split("\n")[0] || "Mint failed";
}

function MintFaucetInner() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const gasOverrides = useGasOverrides();

  const { data: balance, refetch } = useUsdcBalance(address);

  const { writeContract, isPending, data: txHash } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  async function handleMint() {
    if (chain?.id !== arbitrumSepolia.id) {
      try {
        await switchChainAsync({ chainId: arbitrumSepolia.id });
      } catch {
        toast.error("Please switch to Arbitrum Sepolia in your wallet.");
        return;
      }
    }

    writeContract(
      {
        ...mockUsdcConfig,
        functionName: "mint",
        args: [MINT_AMOUNT],
        ...gasOverrides,
      },
      {
        onSuccess: () => {
          toast.success("Minted 10,000 mUSDC!");
          refetch();
        },
        onError: (err) => {
          toast.error(friendlyError(err));
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

export function MintFaucet() {
  return (
    <ChainGuard>
      <MintFaucetInner />
    </ChainGuard>
  );
}
