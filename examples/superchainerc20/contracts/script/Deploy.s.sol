// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {ICreateX} from "createx/ICreateX.sol";

import {DeployUtils} from "../libraries/DeployUtils.sol";
import {InitialSupplySuperchainERC20} from "../src/InitialSupplySuperchainERC20.sol";

// Deploys with CREATE2 through CreateX, so every contract gets the same address
// on every chain in rpcUrls.
contract Deploy is Script {
    /// @notice RPC URLs to deploy to. Defaults to the supersim chains this repo runs.
    string[] private rpcUrls = [
        vm.envOr("CHAIN_A_RPC_URL", string("http://127.0.0.1:9545")),
        vm.envOr("CHAIN_B_RPC_URL", string("http://127.0.0.1:9546"))
    ];

    /// @notice Modifier that wraps a function in broadcasting.
    modifier broadcast() {
        vm.startBroadcast(msg.sender);
        _;
        vm.stopBroadcast();
    }

    function run() public {
        for (uint256 i = 0; i < rpcUrls.length; i++) {
            string memory rpcUrl = rpcUrls[i];

            console.log("Deploying to RPC: ", rpcUrl);
            vm.createSelectFork(rpcUrl);
            deployInitialSupplySuperchainERC20Contract();
        }
    }

    // The initial supply chain id has to be the same constant on every chain. It
    // decides which single chain mints the supply, and it is part of the init code,
    // so passing block.chainid would both mint everywhere and give the token a
    // different address per chain.
    function deployInitialSupplySuperchainERC20Contract() public broadcast returns (address addr_) {
        uint256 initialSupplyChainId = vm.envOr("INITIAL_SUPPLY_CHAIN_ID", uint256(901));
        bytes memory initCode = abi.encodePacked(
            type(InitialSupplySuperchainERC20).creationCode,
            abi.encode(msg.sender, "Test", "TEST", 18, 1000, initialSupplyChainId)
        );
        addr_ = DeployUtils.deployContract("InitialSupplySuperchainERC20", _implSalt(), initCode);
    }

    /// @notice The CREATE2 salt to be used when deploying a contract.
    function _implSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(vm.envOr("DEPLOY_SALT", string("ethers phoenix"))));
    }
}
