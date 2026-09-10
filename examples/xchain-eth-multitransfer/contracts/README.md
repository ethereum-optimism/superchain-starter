# Contracts

Smart contracts demonstrating cross-chain messaging on the Superchain using [interoperability](https://specs.optimism.io/interop/overview.html).

## Development

### Dependencies

```bash
forge install
```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

Deploy to multiple chains using either:

1. Super CLI:

```bash
cd ../ && pnpm sup
```

2. Direct Forge script deployment:

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Architecture

### Cross-Chain Multisend Flow

1. User calls `send(destinationChainId, sends[])` on `CrossChainETHMultitransfer` with ETH value
2. Contract bridges ETH to destination chain using `SuperchainETHBridge.sendETH()`
3. Contract sends relay message via `L2ToL2CrossDomainMessenger`
4. On destination chain:
   - Message is delivered to `CrossChainETHMultitransfer.relay()`
   - Contract verifies the ETH bridge message was successful
   - Contract distributes ETH to all specified recipients

## Testing

Tests are in `test/` directory:

- Unit tests for both contracts
- Uses Foundry's cheatcodes for chain simulation

```bash
forge test
```

## License

MIT
