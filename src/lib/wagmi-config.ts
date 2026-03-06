import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
