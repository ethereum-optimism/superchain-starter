export const crossChainCounterAbi = [
  { type: 'function', name: 'increment', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'lastIncrementer',
    inputs: [],
    outputs: [
      { name: 'chainId', type: 'uint256', internalType: 'uint256' },
      { name: 'sender', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'number',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'CounterIncremented',
    inputs: [
      { name: 'senderChainId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newValue', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  { type: 'error', name: 'CallerNotL2ToL2CrossDomainMessenger', inputs: [] },
] as const;
