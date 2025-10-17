import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [base],
    connectors: [
      baseAccount({
        appName: "Sub Accounts Demo",
        subAccounts: {
          creation: "on-connect",
          defaultAccount: "sub",
        },
        paymasterUrls: {
          [base.id]: process.env
            .NEXT_PUBLIC_PAYMASTER_SERVICE_URL as string,
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
