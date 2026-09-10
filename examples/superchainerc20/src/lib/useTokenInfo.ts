import { tokenAddress } from '@/config';
import { erc20Abi } from 'viem';
import { useReadContracts } from 'wagmi';

const tokenContract = {
  address: tokenAddress,
  abi: erc20Abi,
};

export const useTokenInfo = () => {
  const result = useReadContracts({
    contracts: [
      {
        ...tokenContract,
        functionName: 'symbol',
      },
      {
        ...tokenContract,
        functionName: 'decimals',
      },
      {
        ...tokenContract,
        functionName: 'name',
      },
    ],
  });
  const [symbol, decimals, name] = result.data || [];

  return {
    symbol: symbol?.result,
    decimals: decimals?.result,
    name: name?.result,
  };
};
