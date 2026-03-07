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
  const { address, isConnected, chain, connector } = useAccount();

  const { data: balance, refetch } = useUsdcBalance(address);

  const { writeContract, isPending, data: txHash } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  function handleMint() {
    // #region agent log
    fetch('http://127.0.0.1:7799/ingest/50c2e058-c8ce-4b75-8371-725b4e95ae7b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c22be9'},body:JSON.stringify({sessionId:'c22be9',location:'mint-faucet.tsx:handleMint',message:'handleMint called',data:{address,chainId:chain?.id,chainName:chain?.name,connectorName:connector?.name,contractAddr:mockUsdcConfig.address,contractChainId:mockUsdcConfig.chainId},timestamp:Date.now(),hypothesisId:'H-F'})}).catch(()=>{});
    // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7799/ingest/50c2e058-c8ce-4b75-8371-725b4e95ae7b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c22be9'},body:JSON.stringify({sessionId:'c22be9',location:'mint-faucet.tsx:handleMint:error',message:'Mint error full',data:{errorMsg:err.message,errorName:err.name,errorCause:String(err.cause)},timestamp:Date.now(),hypothesisId:'H-F'})}).catch(()=>{});
          // #endregion
          toast.error(err.message.slice(0, 300) || "Mint failed");
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
