# Superchain Starter Kit: CrossChain Flash Loan Example

> [!WARNING]
> **This example does not currently work on any live chain.** It depends on the
> `SuperchainTokenBridge` predeploy at `0x4200000000000000000000000000000000000028`,
> which was removed from the OP Stack in
> [ethereum-optimism/optimism#19999](https://github.com/ethereum-optimism/optimism/pull/19999).
> No token bridge has replaced it, so SuperchainERC20 tokens cannot move between
> chains today. `0.1.0-alpha.59` is the last supersim release that still deploys
> the bridge, so this example will not run locally on anything newer. `CrosschainFlashLoanBridge.sol` calls that address directly, and this example has no tests.
>
> It is kept here so the code is not lost. It will be revisited when a token
> bridge predeploy exists again, and may need rewriting rather than restoring if
> the replacement differs from what was removed.

> Generated from [superchain-starter](https://github.com/ethereum-optimism/superchain-starter). See the original repository for a more detailed development guide.
>
> SuperchainERC20s can be deployed on any chain, but will only be interoperable within the [Superchain interop cluster](https://docs.optimism.io/stack/interop/explainer#superchain-interop-cluster).

Example Superchain app (contract + frontend) that uses interop to flash loan ERC20s between chains.

![Screenshot 2025-02-18 at 3 38 51 PM](https://github.com/user-attachments/assets/1a4a743c-bc9a-4462-82dc-2273d5c8249e)

## 🔗 Contracts

### [CrosschainFlashLoanBridge.sol](./contracts/src/CrosschainFlashLoanBridge.sol)
### [FlashLoanVault.sol](./contracts/src/FlashLoanVault.sol)
### [CrosschainFlashLoanToken.sol](./contracts/src/CrosschainFlashLoanToken.sol)
### [TargetContract.sol](./contracts/src/TargetContract.sol)

## 📝 Overview

This project implements a cross-chain flash loan system that allows users to borrow tokens on one chain and use them on another chain. Here's how it works:

1. The system consists of several key contracts:
   - `CrosschainFlashLoanToken (CXL)`: The ERC20 token used for flash loans
   - `FlashLoanVault`: Manages flash loans on each chain
   - `CrosschainFlashLoanBridge`: Coordinates cross-chain flash loan execution
   - `TargetContract`: Example contract that uses the flash-loaned tokens

2. Flow:
   - User initiates a cross-chain flash loan by calling `initiateCrosschainFlashLoan` on `CrosschainFlashLoanBridge` on the source chain
   - The bridge sends tokens to the destination chain
   - On the destination chain, the bridge:
     - Creates a flash loan in the vault
     - Executes the user's specified action with the borrowed tokens
     - Repays the flash loan
     - Returns the tokens to the source chain

3. Key Features:
   - Atomic cross-chain flash loans
   - Configurable timeout for loan safety
   - Ability to execute arbitrary actions with borrowed tokens
   - Small flat fee for cross-chain operations

4. Testing:
   - Mint CXL tokens to the bridge contract
   - Execute cross-chain flash loans
   - Verify token balances and target contract state changes
   - Monitor transaction status across chains

The system leverages Optimism's cross-chain messaging system to enable secure and efficient flash loans between L2 chains.

## 🎯 Patterns

### 1. Contract deployed on same address on multiple chains

All contracts are deployed at the same address on all chains. This allows the contracts to:

- "Trust" that the send message was emitted as a side effect of a specific sequence of events
- Process cross-chain messages from itself on other chains
- Maintain consistent behavior across the Superchain

```solidity
      CrossDomainMessageLib.requireCrossDomainCallback();

      ...

      function requireCrossDomainCallback() internal view {
        requireCallerIsCrossDomainMessenger();

        if (
            IL2ToL2CrossDomainMessenger(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER).crossDomainMessageSender()
                != address(this)
        ) revert InvalidCrossDomainSender();
    }
```

The above `CrossDomainMessageLib.requireCrossDomainCallback()` performs two checks

1. That the msg.sender is L2ToL2CrossDomainMessenger
2. That the message being sent was originally emitted on the source chain by the same contract address

Without the second check, it will be possible for ANY address on the source chain to send the message. This is undesirable because now there is no guarantee that the message was generated as a result of someone calling `CrossChainMultisend.send`

### 2. Returning msgHash from functions that emit cross domain messages

The contract captures the msgHash from SuperchainTokenBridge's `sendERC20` call and passes it to the destination chain. This enables:

- Verification that the ERC20 bridge operation completed successfully
- Reliable cross-chain message dependency tracking

This is a pattern for composing cross domain messages. Functions that emit a cross domain message (such as `SuperchainTokenBridge.sendERC20`) should return the message hash so that other contracts can consume / depend on it.

This "returning msgHash pattern" is also used in the `CrosschainFlashLoanBridge.sol`, making it possible for a different contract to compose on this.

```solidity
function initiateCrosschainFlashLoan(uint256 destinationChain, uint256 amount, address target, bytes calldata data) external payable returns (bytes32)
```

### 3. Dependent cross-chain messages

The contract implements a pattern for handling dependent cross-chain messages:

1. First message (ERC20 bridging) must complete successfully
2. Second message (flash loan execution) verifies the first message's success, otherwise reverts
3. Auto-relayer handles the dependency by waiting for the first message before processing the second

```solidity
CrossDomainMessageLib.requireMessageSuccess(sendERC20MsgHash);
```

The above check calls the L2ToL2CrossDomainMessenger.successfulMessages mapping to check that the message corresponding to msgHash was correctly relayed already.

While you can revert using any custom error, it is recommended that such cases emit

```solidity
error RequiredMessageNotSuccessful(bytes32 msgHash)
```

(which [`CrossDomainMessageLib.requireMessageSuccess`](https://github.com/ethereum-optimism/interop-lib/blob/main/src/libraries/CrossDomainMessageLib.sol) does under the hood)

This allows indexers / relayers to realize dependencies between messages, and recognize that a failed relayed message should be retried once the dependent message succeeds at some point in the future.

### 4. Using SuperchainTokenBridge for cross-chain ERC20 transfers

The contract leverages SuperchainTokenBridge to handle cross-chain ERC20 transfers:

- Automatically burns and mints ERC20 as needed
- Provides reliable message hashes for tracking transfers

The high level flow is:

#### Source chain

`function sendERC20(address _to, uint256 _chainId) external payable returns (bytes32 msgHash_);`

1. sends SuperchainERC20 to the destination chain using a crossdomain message

#### Destination chain

`function relayERC20(address _from, address _to, uint256 _amount) external;`

1. relays the SuperchainERC20 to the destination chain

## 🚀 Getting started

### Prerequisites: Foundry & Node

Follow [this guide](https://book.getfoundry.sh/getting-started/installation) to install Foundry

### 1. Create a new repository using this template:

Click the "Use this template" button above on GitHub, or [generate directly](https://github.com/new?template_name=superchain-starter&template_owner=ethereum-optimism)

### 2. Clone your new repository

```bash
git clone <your-new-repository-url>
cd superchain-starter-xchain-flash-loan-example
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

## Security notice

These contracts are not production ready.

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

- ⚡ [Crosschain Flash Loan](https://github.com/ethereum-optimism/superchain-starter-xchain-flash-loan-example)
   - Dependent cross-chain messages (compose multiple cross-domain messages)
   - Using SuperchainTokenBridge for cross-chain ERC20 transfers
   - Multichain lending vaults using `L2ToL2CrossDomainMessenger`
- 💸 [Multitransfer](https://github.com/ethereum-optimism/superchain-starter-xchain-eth-multitransfer)
   - How to set up cross-chain callbacks (contract calling itself on another chain)
   - Using SuperchainETHBridge for cross-chain ETH transfers
   - Dependent cross-chain messages (compose multiple cross-domain messages)
- 🪙 [SuperchainERC20](https://github.com/ethereum-optimism/superchain-starter-superchainerc20)
   - Using ERC-7802 interface for SuperchainERC20 tokens
   - How to upgrade existing ERC20s into SuperchainERC20
   - Minting supply on only one chain
   - Deterministic address deployment on all chains
- 🏓 [CrossChainPingPong](https://docs.optimism.io/app-developers/tutorials/interop/contract-calls)
   - Simple example of passing state between multiple chains using cross domain messenger
   - How to set up cross-chain callbacks (contract calling itself on another chain)
- 🕹️ [CrossChainTicTacToe](https://docs.optimism.io/app-developers/tutorials/interop/event-reads)
   - Allows players to play each other from any chain **without** cross-chain calls, instead relying on cross-chain event reading
   - Creating horizontally scalable apps with interop
   

## ⚖️ License

Files are licensed under the [MIT license](./LICENSE).

<a href="./LICENSE"><img src="https://user-images.githubusercontent.com/35039927/231030761-66f5ce58-a4e9-4695-b1fe-255b1bceac92.png" alt="License information" width="200" /></a>
