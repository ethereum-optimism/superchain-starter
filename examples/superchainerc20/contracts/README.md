# Contracts

Smart contracts demonstrating cross-chain messaging on the Superchain using [interoperability](https://specs.optimism.io/interop/overview.html).

## Contracts

### [InitialSupplySuperchainERC20.sol](./src/InitialSupplySuperchainERC20.sol)

- Extends [SuperchainERC20](https://github.com/ethereum-optimism/interop-lib/blob/main/src/SuperchainERC20.sol) for cross-chain token functionality (implements [ERC-7802](https://github.com/ethereum-optimism/interop-lib/blob/main/src/interfaces/IERC7802.sol))
- Includes configurable name, symbol, and decimals
- Ownable for administrative control
- Mints initial supply only on specified chain ID, supply is minted to the owner

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

## Testing

Tests are in `test/` directory:

- Unit tests for both contracts
- Uses Foundry's cheatcodes for chain simulation

```bash
forge test
```

## License

MIT
