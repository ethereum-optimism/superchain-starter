import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { supersimL2A, supersimL2B } from '@eth-optimism/viem/chains';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [supersimL2A, supersimL2B],
  transports: {
    [supersimL2A.id]: http(),
    [supersimL2B.id]: http(),
  },
});

// When using using the interop-alpha chains, use the following config:

// import { interopAlpha0, interopAlpha1 } from '@eth-optimism/viem/chains';

// const config = createConfig({
//   chains: [interopAlpha0, interopAlpha1],
//   transports: {
//     [interopAlpha0.id]: http(),
//     [interopAlpha1.id]: http(),
//   },
// });

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
