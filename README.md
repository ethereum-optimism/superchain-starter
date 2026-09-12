# Superchain Starter Kit

A lightweight, focused starting point for prototyping/building on the Superchain, featuring

- 🛠 [foundry](https://github.com/foundry-rs/foundry), [supersim](https://github.com/ethereum-optimism/supersim)
- 🎨 wagmi, viem
- [@eth-optimism/viem](https://github.com/ethereum-optimism/ecosystem/tree/main/packages/viem), [@eth-optimism/wagmi](https://github.com/ethereum-optimism/ecosystem/tree/main/packages/wagmi) - viem/wagmi extensions for the Superchain
- 💡 simple example app - CrossChainCounter

<img width="1007" alt="Screenshot 2025-02-17 at 8 09 02 PM" src="https://github.com/user-attachments/assets/af270104-9958-4e0b-8d1f-9b7c099143c9" />

## Examples

This repository is the template. [`examples/`](./examples) holds complete apps built
from it, each runnable on its own. See the [index](./examples/README.md) for what
each one shows and which ones currently work.

## 🚀 Getting started

Get prototyping Superchain apps in under < 1 min! ❤️‍🔥

### Prerequisites: Foundry & Node

Follow [this guide](https://book.getfoundry.sh/getting-started/installation) to install Foundry

### 1. Create a new repository using this template:

Click the "Use this template" button above on GitHub, or [generate directly](https://github.com/new?template_name=superchain-starter&template_owner=ethereum-optimism)

### 2. Clone your new repository

```bash
git clone <your-new-repository-url>
cd <your-new-repository>
```

### 3. Install dependencies

```bash
pnpm i
```

### 4. Get started

```bash
pnpm dev
```

This command will:

- Start a local Superchain network (1 L1 chain and 2 L2 chains) using [supersim](https://github.com/ethereum-optimism/supersim)
- Launch the frontend development server at (http://localhost:5173)
- Deploy the smart contracts to your local network

Start building on the Superchain!

## Deploying contracts

Deployment is a Forge script, [`contracts/script/Deploy.s.sol`](contracts/script/Deploy.s.sol). It
walks a list of RPC URLs and deploys through [CreateX](https://specs.optimism.io/protocol/preinstalls.html#createx)
with CREATE2, so each contract lands on the same address on every chain. That matters for interop:
messages are addressed to a contract, and a shared address means the counterpart is where you expect.

### Deploying

To deploy to your local supersim chains:

```bash
pnpm deploy:supersim
```

To deploy to the `interop-alpha` devnet:

```bash
pnpm deploy:interop-alpha
```

Both build the contracts first, so there is no separate build step.

### Choosing chains and salt

The script reads two environment variables, defaulting to the supersim chains this repo starts:

| Variable | Default |
|---|---|
| `CHAIN_A_RPC_URL` | `http://127.0.0.1:9545` |
| `CHAIN_B_RPC_URL` | `http://127.0.0.1:9546` |

`DEPLOY_SALT` sets the CREATE2 salt, defaulting to `ethers phoenix`. Change it to get a fresh set of
addresses; keep it to redeploy to the same ones.

```bash
CHAIN_A_RPC_URL=https://my-chain-a CHAIN_B_RPC_URL=https://my-chain-b DEPLOY_SALT=my-salt \
  forge script contracts/script/Deploy.s.sol --root contracts --broadcast --private-key $PRIVATE_KEY
```

To deploy to more than two chains, add entries to `rpcUrls` in the script.

## 👀 Overview

### Example app

#### `CrossChainCounter` contract

- Simple `Hello world` for Superchain Interop
- Unlike the [single chain Counter](https://github.com/foundry-rs/foundry/blob/master/crates/forge/assets/CounterTemplate.sol), this one can only be incremented via cross-chain messages
- Learn more about this contract [here](./contracts/README.md)

### Tools

- **[supersim](https://github.com/ethereum-optimism/supersim)**: Local test environment with 1 L1 and multiple L2 chains, includes pre-deployed Superchain contracts
- **foundry**: Blazing fast smart contract development framework
- **wagmi / viem**: Best in class Typescript library for the EVM,
- **vite / tailwind / shadcn**: Frontend development tools and UI components

### 📁 Directory structure

This starter kit is organized to get you building on the Superchain as quickly as possible. Solidity code goes in `/contracts`, and the typescript frontend goes in `/src`

```
superchain-starter/
├── contracts/                   # Smart contract code (Foundry)
├── src/                        # Frontend code (vite, tailwind, shadcn, wagmi, viem)
│   └── App.tsx                # Main application component
├── public/                     # Static assets for the frontend
├── supersim-logs/             # Local supersim logs
├── package.json               # Project dependencies and scripts
└── mprocs.yaml               # Run multiple commands using mprocs
```

### A note on project structure

While this structure is great for getting started and building proof of concepts, it's worth noting that many production applications eventually migrate to separate repositories for contracts and frontend code.

For reference, here are some examples of this separation in production applications:

- Uniswap: [Uniswap contracts](https://github.com/Uniswap/v4-core), [Uniswap frontend](https://github.com/Uniswap/interface)
- Across: [Across contracts](https://github.com/across-protocol/contracts), [Across frontend](https://github.com/across-protocol/frontend)
- Farcaster: [Farcaster contracts](https://github.com/farcasterxyz/contracts)

## 🐛 Debugging

Use the error selectors below to identify the cause of reverts.

- For a complete list of error signatures from interoperability contracts, see [abi-signatures.md](https://github.com/ethereum-optimism/ecosystem/blob/main/packages/viem/docs/abi-signatures.md)
- Examples:
  - `TargetCallFailed()`: `0xeda86850`
  - `MessageAlreadyRelayed`: `0x9ca9480b`
  - `Unauthorized()`: `0x82b42900`
 
 
## 📚 More resources

- Interop recipes / guides: https://docs.optimism.io/app-developers/tutorials/interop
- Superchain Dev Console: https://console.optimism.io/

## 😎 Moooaaar examples

Want to see more? Here are more example crosschain apps for inspiration / patterns!

- ⚡ [Crosschain Flash Loan](./examples/xchain-flash-loan)
   - Dependent cross-chain messages (compose multiple cross-domain messages)
   - Using SuperchainTokenBridge for cross-chain ERC20 transfers
   - Multichain lending vaults using `L2ToL2CrossDomainMessenger`
- 💸 [Multitransfer](./examples/xchain-eth-multitransfer)
   - How to set up cross-chain callbacks (contract calling itself on another chain)
   - Using SuperchainETHBridge for cross-chain ETH transfers
   - Dependent cross-chain messages (compose multiple cross-domain messages)
- 🪙 [SuperchainERC20](./examples/superchainerc20)
   - Using ERC-7802 interface for SuperchainERC20 tokens
   - How to upgrade existing ERC20s into SuperchainERC20
   - Minting supply on only one chain
   - Deterministic address deployment on all chains
- 🏓 [CrossChainPingPong](./examples/pingpong)
   - Simple example of passing state between multiple chains using cross domain messenger
   - How to set up cross-chain callbacks (contract calling itself on another chain)
- 🕹️ [CrossChainTicTacToe](https://docs.optimism.io/app-developers/tutorials/interop/event-reads)
   - Allows players to play each other from any chain **without** cross-chain calls, instead relying on cross-chain event reading
   - Creating horizontally scalable apps with interop
   
## ⚖️ License

Files are licensed under the [MIT license](./LICENSE).

<a href="./LICENSE"><img src="https://user-images.githubusercontent.com/35039927/231030761-66f5ce58-a4e9-4695-b1fe-255b1bceac92.png" alt="License information" width="200" /></a>
