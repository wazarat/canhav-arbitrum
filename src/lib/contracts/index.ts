import { purchasePoolAbi } from "./PurchasePool.abi";
import { mockUSDCAbi } from "./MockUSDC.abi";
import { arbitrumSepolia } from "viem/chains";

export const PURCHASE_POOL_ADDRESS = (process.env
  .NEXT_PUBLIC_PURCHASE_POOL_ADDRESS ?? "0x") as `0x${string}`;

export const MOCK_USDC_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ??
  "0x") as `0x${string}`;

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7799/ingest/50c2e058-c8ce-4b75-8371-725b4e95ae7b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c22be9'},body:JSON.stringify({sessionId:'c22be9',location:'contracts/index.ts:init',message:'Contract addresses at runtime',data:{PURCHASE_POOL_ADDRESS,MOCK_USDC_ADDRESS,rawPurchase:process.env.NEXT_PUBLIC_PURCHASE_POOL_ADDRESS,rawUsdc:process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
}
// #endregion

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
