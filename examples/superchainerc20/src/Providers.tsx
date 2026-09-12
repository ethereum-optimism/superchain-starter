import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { Toaster } from '@/components/ui/sonner';
import { config } from '@/config';

const queryClient = new QueryClient();

// When using using the interop-alpha chains, use the following config:
// const network = interopAlphaNetwork;

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
