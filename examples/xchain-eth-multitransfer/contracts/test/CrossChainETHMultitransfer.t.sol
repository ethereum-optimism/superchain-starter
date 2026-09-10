// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {ISuperchainETHBridge} from "@interop-lib/interfaces/ISuperchainETHBridge.sol";
import {CrossChainETHMultitransfer} from "../src/CrossChainETHMultitransfer.sol";

contract CrossChainETHMultitransferTest is Test {
    CrossChainETHMultitransfer public multisend;
    address alice;
    address bob;
    address charlie;
    bytes32 constant MOCK_MSG_HASH = bytes32(uint256(1));

    function setUp() public {
        multisend = new CrossChainETHMultitransfer();
        alice = vm.addr(1);
        bob = vm.addr(2);
        charlie = vm.addr(3);
    }

    function test_send_succeeds() public {
        uint256 destChainId = 901;
        vm.chainId(902); // Current chain

        // Create sends array
        CrossChainETHMultitransfer.Send[] memory sends = new CrossChainETHMultitransfer.Send[](2);
        sends[0] = CrossChainETHMultitransfer.Send(bob, 1 ether);
        sends[1] = CrossChainETHMultitransfer.Send(charlie, 2 ether);

        // Mock SuperchainETHBridge.sendETH call
        vm.mockCall(
            PredeployAddresses.SUPERCHAIN_ETH_BRIDGE,
            abi.encodeWithSelector(ISuperchainETHBridge.sendETH.selector, address(multisend), destChainId),
            abi.encode(MOCK_MSG_HASH)
        );

        // Mock L2ToL2CrossDomainMessenger.sendMessage call
        vm.mockCall(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(
                IL2ToL2CrossDomainMessenger.sendMessage.selector,
                destChainId,
                address(multisend),
                abi.encodeCall(CrossChainETHMultitransfer.relay, (MOCK_MSG_HASH, sends))
            ),
            abi.encode(bytes32(0))
        );

        // Expect the calls
        vm.expectCall(
            PredeployAddresses.SUPERCHAIN_ETH_BRIDGE,
            3 ether,
            abi.encodeWithSelector(ISuperchainETHBridge.sendETH.selector, address(multisend), destChainId)
        );

        vm.expectCall(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(
                IL2ToL2CrossDomainMessenger.sendMessage.selector,
                destChainId,
                address(multisend),
                abi.encodeCall(CrossChainETHMultitransfer.relay, (MOCK_MSG_HASH, sends))
            )
        );

        // Send with correct value
        multisend.send{value: 3 ether}(destChainId, sends);
    }

    function test_send_incorrectValue_reverts() public {
        uint256 destChainId = 901;

        CrossChainETHMultitransfer.Send[] memory sends = new CrossChainETHMultitransfer.Send[](2);
        sends[0] = CrossChainETHMultitransfer.Send(bob, 1 ether);
        sends[1] = CrossChainETHMultitransfer.Send(charlie, 2 ether);

        vm.expectRevert();
        // Send with incorrect value (2 ether instead of 3)
        multisend.send{value: 2 ether}(destChainId, sends);
    }

    function test_relay_succeeds() public {
        vm.chainId(902);

        // Setup contract with initial balances (as if the WETH contract has sent the ETH)
        vm.deal(address(multisend), 3 ether);

        CrossChainETHMultitransfer.Send[] memory sends = new CrossChainETHMultitransfer.Send[](2);
        sends[0] = CrossChainETHMultitransfer.Send(bob, 1 ether);
        sends[1] = CrossChainETHMultitransfer.Send(charlie, 2 ether);

        // Mock cross-domain message validation
        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSender.selector),
            abi.encode(address(multisend))
        );

        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.successfulMessages.selector),
            abi.encode(true)
        );

        // Record initial balances
        uint256 bobInitialBalance = bob.balance;
        uint256 charlieInitialBalance = charlie.balance;

        // Execute relay as if from the cross-domain messenger
        vm.prank(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
        multisend.relay(MOCK_MSG_HASH, sends);

        // Verify the transfers
        assertEq(bob.balance, bobInitialBalance + 1 ether);
        assertEq(charlie.balance, charlieInitialBalance + 2 ether);
    }

    // Helper function to mock and expect a call
    function _mockAndExpect(address _receiver, bytes memory _calldata, bytes memory _returned) internal {
        vm.mockCall(_receiver, _calldata, _returned);
        vm.expectCall(_receiver, _calldata);
    }
}
