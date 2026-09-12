// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {CrossDomainMessageLib} from "@interop-lib/libraries/CrossDomainMessageLib.sol";
import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {ISuperchainETHBridge} from "@interop-lib/interfaces/ISuperchainETHBridge.sol";

error IncorrectValue();

contract CrossChainETHMultitransfer {
    struct Send {
        address to;
        uint256 amount;
    }

    ISuperchainETHBridge internal immutable superchainETHBridge = ISuperchainETHBridge(payable(PredeployAddresses.SUPERCHAIN_ETH_BRIDGE));
    IL2ToL2CrossDomainMessenger internal immutable l2ToL2CrossDomainMessenger =
        IL2ToL2CrossDomainMessenger(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);

    receive() external payable {}

    function send(uint256 _destinationChainId, Send[] calldata _sends) public payable returns (bytes32) {
        uint256 totalAmount;
        for (uint256 i; i < _sends.length; i++) {
            totalAmount += _sends[i].amount;
        }

        if (msg.value != totalAmount) revert IncorrectValue();

        bytes32 sendETHMsgHash = superchainETHBridge.sendETH{value: totalAmount}(address(this), _destinationChainId);

        return l2ToL2CrossDomainMessenger.sendMessage(
            _destinationChainId, address(this), abi.encodeCall(this.relay, (sendETHMsgHash, _sends))
        );
    }

    function relay(bytes32 _sendETHMsgHash, Send[] calldata _sends) public {
        CrossDomainMessageLib.requireCrossDomainCallback();
        // CrossDomainMessageLib.requireMessageSuccess uses a special error signature that the
        // auto-relayer performs special handling on. The auto-relayer parses the _sendETHMsgHash
        // and waits for the _sendETHMsgHash to be relayed before relaying this message.
        CrossDomainMessageLib.requireMessageSuccess(_sendETHMsgHash);

        for (uint256 i; i < _sends.length; i++) {
            address to = _sends[i].to;
            // use .call for example purpose, but not recommended in production.
            (bool success,) = to.call{value: _sends[i].amount}("");
            require(success, "ETH transfer failed");
        }
    }
}
