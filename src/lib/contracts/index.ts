import { purchasePoolAbi } from "./PurchasePool.abi";
import { mockUSDCAbi } from "./MockUSDC.abi";
import { arbitrumSepolia } from "viem/chains";

export const PURCHASE_POOL_ADDRESS = (process.env
  .NEXT_PUBLIC_PURCHASE_POOL_ADDRESS ?? "0x") as `0x${string}`;

export const MOCK_USDC_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ??
  "0x") as `0x${string}`;

export const purchasePoolConfig = {
  address: PURCHASE_POOL_ADDRESS,
  abi: purchasePoolAbi,
  chainId: arbitrumSepolia.id,
} as const;

export const mockUsdcConfig = {
  address: MOCK_USDC_ADDRESS,
  abi: mockUSDCAbi,
  chainId: arbitrumSepolia.id,
} as const;

export { purchasePoolAbi, mockUSDCAbi };
