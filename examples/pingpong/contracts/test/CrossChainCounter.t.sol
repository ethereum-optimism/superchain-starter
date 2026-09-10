// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {CrossChainCounter} from "../src/CrossChainCounter.sol";

contract CrossChainCounterTest is Test {
    CrossChainCounter public counter;
    address bob;

    // Helper function to mock and expect a call
    function _mockAndExpect(address _receiver, bytes memory _calldata, bytes memory _returned) internal {
        vm.mockCall(_receiver, _calldata, _returned);
        vm.expectCall(_receiver, _calldata);
    }

    function setUp() public {
        counter = new CrossChainCounter();
        bob = vm.addr(1);
    }

    // Test incrementing from a valid cross-chain message
    function test_increment_crossDomain_succeeds() public {
        uint256 fromChainId = 901;
        vm.chainId(902); // Current chain

        // Mock the cross-domain message sender validation
        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSender.selector),
            abi.encode(bob)
        );

        // Mock the cross-domain message source
        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSource.selector),
            abi.encode(fromChainId)
        );

        // Expect the CounterIncremented event
        vm.expectEmit(true, true, true, true, address(counter));
        emit CrossChainCounter.CounterIncremented(fromChainId, bob, 1);

        // Call increment as if from the L2_TO_L2_CROSS_DOMAIN_MESSENGER
        vm.prank(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
        counter.increment();

        // Verify the counter was incremented
        assertEq(counter.number(), 1);

        // Verify the last incrementer details
        (uint256 lastChainId, address lastSender) = counter.lastIncrementer();
        assertEq(lastChainId, fromChainId);
        assertEq(lastSender, bob);
    }

    // Test incrementing with an invalid sender (not the cross-domain messenger)
    function test_increment_invalidSender_reverts() public {
        vm.expectRevert(); // Will revert with CallerNotCrossDomainMessenger
        counter.increment();
    }

    // Test multiple increments from different chains
    function test_increment_multipleChains_succeeds() public {
        // First increment from chain 901
        uint256 firstChainId = 901;
        address firstSender = vm.addr(2);
        vm.chainId(902);

        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSender.selector),
            abi.encode(firstSender)
        );

        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSource.selector),
            abi.encode(firstChainId)
        );

        vm.prank(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
        counter.increment();

        // Second increment from chain 903
        uint256 secondChainId = 903;
        address secondSender = vm.addr(3);

        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSender.selector),
            abi.encode(secondSender)
        );

        _mockAndExpect(
            PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            abi.encodeWithSelector(IL2ToL2CrossDomainMessenger.crossDomainMessageSource.selector),
            abi.encode(secondChainId)
        );

        vm.prank(PredeployAddresses.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
        counter.increment();

        // Verify final counter value
        assertEq(counter.number(), 2);

        // Verify last incrementer is from the second chain
        (uint256 lastChainId, address lastSender) = counter.lastIncrementer();
        assertEq(lastChainId, secondChainId);
        assertEq(lastSender, secondSender);
    }
}
