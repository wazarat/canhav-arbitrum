"use client";

import { useQuery } from "@tanstack/react-query";
import { publicClient } from "@/lib/public-client";
import {
  PURCHASE_POOL_ADDRESS,
  purchasePoolAbi,
} from "@/lib/contracts";
import type { PoolData } from "@/lib/hooks";

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

const hasValidConfig =
  PURCHASE_POOL_ADDRESS.length > 4 &&
  !!process.env.NEXT_PUBLIC_ALCHEMY_URL;


export function usePublicPoolCount() {
  return useQuery({
    queryKey: ["poolCount"],
    queryFn: async () => {
      if (!hasValidConfig) {
        throw new Error("Missing NEXT_PUBLIC_PURCHASE_POOL_ADDRESS or NEXT_PUBLIC_ALCHEMY_URL");
      }
      const result = await publicClient.readContract({
        address: PURCHASE_POOL_ADDRESS,
        abi: purchasePoolAbi,
        functionName: "nextPoolId",
      });
      return Number(result);
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function usePublicPools(count: number) {
  return useQuery({
    queryKey: ["pools", count],
    queryFn: async () => {
      if (count === 0) return [];

      const calls = Array.from({ length: count }, (_, i) => ({
        address: PURCHASE_POOL_ADDRESS,
        abi: purchasePoolAbi,
        functionName: "getPool" as const,
        args: [BigInt(i)] as const,
      }));

      const results = await publicClient.multicall({ contracts: calls });

      return results
        .map((r, i) => {
          if (r.status !== "success" || !r.result) return null;
          return toPoolData(i, r.result as unknown as GetPoolResult);
        })
        .filter((p): p is PoolData => p !== null);
    },
    enabled: count > 0,
    staleTime: 30_000,
  });
}
