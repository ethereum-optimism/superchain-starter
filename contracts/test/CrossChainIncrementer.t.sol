// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {console} from "forge-std/console.sol";
import {IL2ToL2CrossDomainMessenger} from "@interop-lib/interfaces/IL2ToL2CrossDomainMessenger.sol";
import {PredeployAddresses} from "@interop-lib/libraries/PredeployAddresses.sol";
import {Relayer} from "@interop-lib/test/Relayer.sol";
import {CrossChainCounterIncrementer} from "../src/CrossChainCounterIncrementer.sol";
import {CrossChainCounter} from "../src/CrossChainCounter.sol";

contract CrossChainIncrementerTest is Relayer, Test {
    CrossChainCounterIncrementer public incrementer;
    CrossChainCounter public counter;

    string[] private rpcUrls = [
        vm.envOr("CHAIN_A_RPC_URL", string("https://interop-rc-alpha-0.optimism.io/")),
        vm.envOr("CHAIN_B_RPC_URL", string("https://interop-rc-alpha-1.optimism.io/"))
    ];

    constructor() Relayer(rpcUrls) {}

    function setUp() public {
        vm.selectFork(forkIds[0]);
        incrementer = new CrossChainCounterIncrementer{salt: bytes32(0)}();

        vm.selectFork(forkIds[1]);
        counter = new CrossChainCounter{salt: bytes32(0)}();
    }

    // Test incrementing from a valid cross-chain message
    function test_increment_crossDomain_succeeds() public {
        vm.selectFork(forkIds[0]);

        incrementer.increment(chainIdByForkId[forkIds[1]], address(counter));

        // verify counter has not been incremented on chainB
        vm.selectFork(forkIds[1]);
        assertEq(counter.number(), 0);

        relayAllMessages();

        // verify counter has been incremented on chainB
        vm.selectFork(forkIds[1]);
        assertEq(counter.number(), 1);
    }
}
