import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

/**
 * On Arbitrum Sepolia the RPC's `eth_gasPrice` can return a value *below*
 * the current `baseFee`, which makes wallet gas estimation fail.
 * This hook fetches the latest base fee and returns overrides with a 3x buffer
 * so transactions don't revert on submission.
 */
export function useGasOverrides() {
  const publicClient = usePublicClient();

  const { data } = useQuery({
    queryKey: ["gas-overrides"],
    queryFn: async () => {
      if (!publicClient) return null;
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const baseFee = block.baseFeePerGas ?? 20_000_000n;
      return {
        maxFeePerGas: baseFee * 3n,
        maxPriorityFeePerGas: baseFee / 10n || 1n,
      };
    },
    refetchInterval: 15_000,
    enabled: !!publicClient,
  });

  return data ?? undefined;
}
