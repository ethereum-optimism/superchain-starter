// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {CrossDomainMessageLib} from "@interop-lib/libraries/CrossDomainMessageLib.sol";

/// @title CrossChainCounter
/// @notice A simple Counter that can only be incremented **from other chains**
contract CrossChainCounter {
    /// @notice Emitted when the counter is incremented from another chain
    /// @param senderChainId The chain ID where the increment request originated
    /// @param sender The address that requested the increment on the origin chain
    /// @param newValue The new value of the counter after incrementing
    event CounterIncremented(uint256 indexed senderChainId, address indexed sender, uint256 newValue);

    /// @notice Struct to store the last incrementer's details
    struct Incrementer {
        uint256 chainId; // The chain ID where the increment originated
        address sender; // The address that triggered the increment
    }

    /// @notice The current value of the counter
    uint256 public number;

    /// @notice Details about the last address to increment the counter
    Incrementer public lastIncrementer;

    /// @notice Increments the counter by 1
    /// @dev Can only be called through the L2ToL2CrossDomainMessenger contract
    function increment() public {
        // Verify that this function is being called by the L2ToL2CrossDomainMessenger contract
        CrossDomainMessageLib.requireCallerIsCrossDomainMessenger();

        // Get the original sender's address from the origin chain
        address sender =
            IL2ToL2CrossDomainMessenger(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER).crossDomainMessageSender();

        // Get the chain ID where the increment request originated
        uint256 senderChainId =
            IL2ToL2CrossDomainMessenger(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER).crossDomainMessageSource();

        // Increment the counter
        number += 1;

        // Store the incrementer's details
        lastIncrementer = Incrementer(senderChainId, sender);

        // Emit an event for off-chain tracking and indexing
        emit CounterIncremented(senderChainId, sender, number);
    }
}
