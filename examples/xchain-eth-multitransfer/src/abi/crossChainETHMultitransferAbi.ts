export const crossChainETHMultitransferAbi = [
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    name: 'relay',
    inputs: [
      { name: '_sendWethMsgHash', type: 'bytes32', internalType: 'bytes32' },
      {
        name: '_sends',
        type: 'tuple[]',
        internalType: 'struct CrossChainETHMultitransfer.Send[]',
        components: [
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'send',
    inputs: [
      { name: '_destinationChainId', type: 'uint256', internalType: 'uint256' },
      {
        name: '_sends',
        type: 'tuple[]',
        internalType: 'struct CrossChainETHMultitransfer.Send[]',
        components: [
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'payable',
  },
  { type: 'error', name: 'CallerNotL2ToL2CrossDomainMessenger', inputs: [] },
  {
    type: 'error',
    name: 'DependentMessageNotSuccessful',
    inputs: [{ name: 'msgHash', type: 'bytes32', internalType: 'bytes32' }],
  },
  { type: 'error', name: 'IncorrectValue', inputs: [] },
  { type: 'error', name: 'InvalidCrossDomainSender', inputs: [] },
] as const;
