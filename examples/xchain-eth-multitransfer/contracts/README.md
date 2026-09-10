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

Deploy to every chain the script targets, from the project root:

```bash
pnpm deploy:supersim
```

That runs the Forge script below, which deploys through CreateX with CREATE2 so each contract gets
the same address on every chain. To run it directly:

```bash
forge script script/Deploy.s.sol --broadcast --private-key $PRIVATE_KEY
```

`CHAIN_A_RPC_URL` and `CHAIN_B_RPC_URL` override the target chains, and `DEPLOY_SALT` the salt.

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
