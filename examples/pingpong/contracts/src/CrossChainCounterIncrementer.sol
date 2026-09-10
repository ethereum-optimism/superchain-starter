// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {CrossDomainMessageLib} from "@interop-lib/libraries/CrossDomainMessageLib.sol";

import {CrossChainCounter} from "./CrossChainCounter.sol";

/// @title CrossChainCounterIncrementer
/// @notice A contract that sends cross-chain messages to increment a counter on another chain
contract CrossChainCounterIncrementer {
    /// @dev The L2 to L2 cross domain messenger predeploy to handle message passing
    IL2ToL2CrossDomainMessenger internal messenger =
        IL2ToL2CrossDomainMessenger(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);

    /// @notice Sends a message to increment a counter on another chain
    /// @param counterChainId The chain ID where the target counter contract is deployed
    /// @param counterAddress The address of the counter contract on the target chain
    function increment(uint256 counterChainId, address counterAddress) public {
        // Send a cross-chain message to increment the counter on the target chain
        messenger.sendMessage(
            counterChainId, counterAddress, abi.encodeWithSelector(CrossChainCounter.increment.selector)
        );
    }
}
