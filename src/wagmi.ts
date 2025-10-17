import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      baseAccount({
        appName: "Sub Accounts Demo",
        subAccounts: {
          creation: "on-connect",
          defaultAccount: "sub",
        },
        paymasterUrls: {
          [baseSepolia.id]: process.env
            .NEXT_PUBLIC_PAYMASTER_SERVICE_URL as string,
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
