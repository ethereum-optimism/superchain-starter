# Contracts

Smart contracts demonstrating cross-chain messaging on the Superchain using [interoperability](https://specs.optimism.io/interop/overview.html).

## Contracts

### [CrossChainCounter.sol](./src/CrossChainCounter.sol)

- Counter that can only be incremented through cross-chain messages
- Uses `L2ToL2CrossDomainMessenger` for message verification
- Tracks last incrementer's chain ID and address
- Events emitted for all increments with source chain details

### [CrossChainCounterIncrementer.sol](./src/CrossChainCounterIncrementer.sol)

- Sends cross-chain increment messages to `CrossChainCounter` instances
- Uses `L2ToL2CrossDomainMessenger` for message passing

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

1. Super CLI (recommended):

```bash
cd ../ && pnpm sup
```

2. Direct Forge script:

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Architecture

### Cross-Chain Messaging Flow (1)

1. User calls `increment(chainId, counterAddress)` on `CrossChainCounterIncrementer`
2. `CrossChainCounterIncrementer` sends message via `L2ToL2CrossDomainMessenger`
3. Target chain's messenger delivers message to `CrossChainCounter`
4. `CrossChainCounter` verifies messenger and executes increment

### Cross-Chain Messaging Flow (2)

1. User calls `increment(chainId, counterAddress)` on `CrossChainCounterIncrementer` by directly ending a message through `L2ToL2CrossDomainMessenger`
2. Target chain's messenger delivers message to `CrossChainCounter`
3. `CrossChainCounter` verifies messenger and executes increment

## Testing

Tests are in `test/` directory:

- Unit tests for both contracts
- Uses Foundry's cheatcodes for chain simulation

```bash
forge test
```

## License

MIT
