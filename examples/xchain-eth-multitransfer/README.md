# Superchain Starter Kit: CrossChainETHMultitransfer

> Generated from [superchain-starter](https://github.com/ethereum-optimism/superchain-starter). See the original repository for a more detailed development guide.

Example Superchain app (contract + frontend) that uses interop to send ETH to multiple recipients on a different chain.

<img width="1253" alt="Screenshot 2025-02-18 at 8 17 02 AM" src="https://github.com/user-attachments/assets/841675c2-590e-4632-84a9-43cea2269a34" />

## 🔗 Contracts

### [CrossChainETHMultitransfer.sol](./contracts/src/CrossChainETHMultitransfer.sol)

- Enables sending ETH to multiple recipients on a different chain
- Uses `L2ToL2CrossDomainMessenger` for cross-chain message passing
- Leverages `SuperchainETHBridge` for cross-chain ETH transfers
- Implements a two-step process:
  1. Bridges ETH to the destination chain using SuperchainETHBridge
  2. Distributes ETH to multiple recipients on the destination chain
- Includes safety checks for message verification and ETH transfer success

## 📝 Overview

This contract sends two cross-chain messages through the L2ToL2CrossDomainMessenger:

1. (Message 1) to send ETH using SuperchainETHBridge from source to destination chain - triggered by SuperchainETHBridge#sendETH
2. (Message 2) to disperse the received ETH to the recipients on the destination chain - triggered by CrossChainETHMultitransfer#send

Message 2 depends on the success of Message 1, which is enforced by the `CrossDomainMessageLib.requireMessageSuccess(_sendWethMsgHash)` check in the relay function. This ensures that ETH bridging is completed before distribution occurs.

## 🎯 Patterns

### 1. Contract deployed on same address on multiple chains

The CrossChainETHMultitransfer contract is designed to be deployed at the same address on all chains. This allows the contract to:

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

Without the second check, it will be possible for ANY address on the source chain to send the message. This is undesirable because now there is no guarantee that the message was generated as a result of someone calling `CrossChainETHMultitransfer.send`

### 2. Returning msgHash from functions that emit cross domain messages

The contract captures the msgHash from SuperchainETHBridge's sendETH call and passes it to the destination chain. This enables:

- Verification that the ETH bridge operation completed successfully
- Reliable cross-chain message dependency tracking

This is a pattern for composing cross domain messages. Functions that emit a cross domain message (such as `SuperchainETHBridge.sendEth`) should return the message hash so that other contracts can consume / depend on it.

This "returning msgHash pattern" is also used in the `CrossChainETHMultitransfer.sol`, making it possible for a different contract to compose on this.

```solidity
function send(uint256 _destinationChainId, Send[] calldata _sends) public payable returns (bytes32)
```

### 3. Dependent cross-chain messages

The contract implements a pattern for handling dependent cross-chain messages:

1. First message (ETH bridging) must complete successfully
2. Second message (ETH distribution) verifies the first message's success, otherwise reverts
3. Auto-relayer handles the dependency by waiting for the first message before processing the second

```solidity
CrossDomainMessageLib.requireMessageSuccess(_sendWethMsgHash);
```

The above check calls the L2ToL2CrossDomainMessenger.successfulMessages mapping to check that the message corresponding to msgHash was correctly relayed already.

While you can revert using any custom error, it is recommended that such cases emit

```solidity
error RequiredMessageNotSuccessful(bytes32 msgHash)
```

(which [`CrossDomainMessageLib.requireMessageSuccess`](https://github.com/ethereum-optimism/interop-lib/blob/main/src/libraries/CrossDomainMessageLib.sol) does under the hood)

This allows indexers / relayers to realize dependencies between messages, and recognize that a failed relayed message should be retried once the dependent message succeeds at some point in the future.

### 4. Using SuperchainETHBridge for cross-chain ETH transfers

The contract leverages SuperchainETHBridge to handle cross-chain ETH transfers:

- Provides reliable message hashes for tracking transfers
- Maintains ETH value consistency across chains

The high level flow is:

#### Source chain

`function sendETH(address _to, uint256 _chainId) external payable returns (bytes32 msgHash_);`

1. sends ETH to `_to` on `_chainId` using a crossdomain message

#### Destination chain

`function relayETH(address _from, address _to, uint256 _amount) external;`

1. relays the `_amount` of ETH to the `_to` on the destination chain

## 🚀 Getting started

### Prerequisites: Foundry & Node

Follow [this guide](https://book.getfoundry.sh/getting-started/installation) to install Foundry

### 1. Create a new repository using this template:

Click the "Use this template" button above on GitHub, or [generate directly](https://github.com/new?template_name=superchain-starter&template_owner=ethereum-optimism)

### 2. Clone your new repository

```bash
git clone <your-new-repository-url>
cd superchain-starter-multisend
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

This contract is not production ready. For one, the contract does not consider the case when the dispersal fails on the destination chain

1.  if one of the recipient is a contract that has a reverting `receive()` handler
2.  `relay(...)` call will revert, meaning none of the recipients will be able to receive the dispersal

One unimplemented mitigation is to add a withdrawal flow for any failed recipients such that one recipient's failure to receive doesn't prevent the others

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
