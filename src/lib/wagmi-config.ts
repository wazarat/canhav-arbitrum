import { http } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { createConfig } from "@privy-io/wagmi";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
  },
});
