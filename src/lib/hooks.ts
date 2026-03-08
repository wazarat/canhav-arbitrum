"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { purchasePoolConfig, mockUsdcConfig } from "@/lib/contracts";

export interface PoolData {
  id: number;
  productName: string;
  pricePerUnit: bigint;
  moq: bigint;
  deadline: bigint;
  token: `0x${string}`;
  totalUnits: bigint;
  totalDeposited: bigint;
  status: number;
}

type GetPoolResult = readonly [
  string,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  bigint,
  bigint,
  number,
];

function toPoolData(id: number, d: GetPoolResult): PoolData {
  return {
    id,
    productName: d[0],
    pricePerUnit: d[1],
    moq: d[2],
    deadline: d[3],
    token: d[4],
    totalUnits: d[5],
    totalDeposited: d[6],
    status: d[7],
  };
}

export function usePoolCount() {
  return useReadContract({
    ...purchasePoolConfig,
    functionName: "nextPoolId",
  });
}

export function usePool(poolId: number): {
  data: PoolData | undefined;
  isLoading: boolean;
  refetch: () => void;
} {
  const result = useReadContract({
    ...purchasePoolConfig,
    functionName: "getPool",
    args: [BigInt(poolId)],
  });

  const data = result.data ? toPoolData(poolId, result.data as GetPoolResult) : undefined;

  return { data, isLoading: result.isLoading, refetch: result.refetch };
}

export function usePools(count: number) {
  const contracts = Array.from({ length: count }, (_, i) => ({
    ...purchasePoolConfig,
    functionName: "getPool" as const,
    args: [BigInt(i)] as const,
  }));

  const result = useReadContracts({ contracts });

  const pools: PoolData[] = (result.data ?? [])
    .map((r, i) => {
      if (r.status !== "success" || !r.result) return null;
      return toPoolData(i, r.result as unknown as GetPoolResult);
    })
    .filter((p): p is PoolData => p !== null);

  return { pools, isLoading: result.isLoading, refetch: result.refetch };
}

type GetCommitmentResult = readonly [bigint, bigint, boolean];

export function useCommitment(poolId: number, address: `0x${string}` | undefined) {
  const result = useReadContract({
    ...purchasePoolConfig,
    functionName: "getCommitment",
    args: address ? [BigInt(poolId), address] : undefined,
    query: { enabled: !!address },
  });

  const data = result.data
    ? {
        units: (result.data as GetCommitmentResult)[0],
        deposited: (result.data as GetCommitmentResult)[1],
        refunded: (result.data as GetCommitmentResult)[2],
      }
    : undefined;

  return { data, isLoading: result.isLoading, refetch: result.refetch };
}

export function useUsdcBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    ...mockUsdcConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useUsdcAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}`,
) {
  return useReadContract({
    ...mockUsdcConfig,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    query: { enabled: !!owner },
  });
}

export function useOwner() {
  return useReadContract({
    ...purchasePoolConfig,
    functionName: "owner",
  });
}

export function useBuyerCount(poolId: number) {
  return useReadContract({
    ...purchasePoolConfig,
    functionName: "getBuyerCount",
    args: [BigInt(poolId)],
  });
}

export function useFeeBps() {
  return useReadContract({
    ...purchasePoolConfig,
    functionName: "feeBps",
  });
}

export function useTotalFeesCollected() {
  return useReadContract({
    ...purchasePoolConfig,
    functionName: "totalFeesCollected",
  });
}
