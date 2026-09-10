import {
  interopAlphaChains,
  supersimL1,
  supersimL2A,
  supersimL2B,
} from '@eth-optimism/viem/chains';
import { Chain } from 'viem';
import { sepolia } from 'viem/chains';

export type Network = {
  sourceChain: Chain;
  chains: Chain[];
};

export const supersimNetwork = {
  sourceChain: supersimL1,
  chains: [supersimL2A, supersimL2B],
} as const satisfies Network;

export const interopAlphaNetwork = {
  sourceChain: sepolia,
  chains: interopAlphaChains,
} as const satisfies Network;
