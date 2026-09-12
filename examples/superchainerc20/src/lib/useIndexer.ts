import { useEffect, useState } from 'react';
import { PublicClient } from 'viem';
import { createIndexer } from '@/lib/indexer';
import { config, tokenAddress } from '@/config';
import { getPublicClient } from '@wagmi/core';

export function useStartIndexer() {
  const [indexer, setIndexer] = useState<ReturnType<typeof createIndexer> | null>(null);

  useEffect(() => {
    const clients = Object.fromEntries(
      config.chains.map(chain => {
        const client = getPublicClient(config, { chainId: chain.id }) as PublicClient;
        return [chain.id, client];
      })
    );

    const newIndexer = createIndexer(clients, tokenAddress);
    newIndexer.initialize().catch(console.error);
    setIndexer(newIndexer);

    return () => {
      newIndexer.unwatch();
      setIndexer(null);
    };
  }, []);

  return indexer;
}
