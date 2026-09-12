export const crossChainCounterIncrementerAbi = [
  {
    type: 'function',
    name: 'increment',
    inputs: [
      { name: 'counterChainId', type: 'uint256', internalType: 'uint256' },
      { name: 'counterAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
