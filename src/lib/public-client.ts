import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
});
