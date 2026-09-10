// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {ICreateX} from "createx/ICreateX.sol";

import {DeployUtils} from "../libraries/DeployUtils.sol";
import {FlashLoanVault} from "../src/FlashLoanVault.sol";
import {CrosschainFlashLoanToken} from "../src/CrosschainFlashLoanToken.sol";
import {CrosschainFlashLoanBridge} from "../src/CrosschainFlashLoanBridge.sol";
import {TargetContract} from "../src/TargetContract.sol";

// Example forge script for deploying as an alternative to sup: super-cli (https://github.com/ethereum-optimism/super-cli)
contract Deploy is Script {
    /// @notice Array of RPC URLs to deploy to, deploy to supersim 901 and 902 by default.
    string[] private rpcUrls = ["http://localhost:9545", "http://localhost:9546"];

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
            deployFlashLoanVault();
            deployCrosschainFlashLoanToken();
            deployCrosschainFlashLoanBridge();
            deployTargetContract();
        }
    }

    function deployFlashLoanVault() public broadcast returns (address addr_) {
        bytes memory initCode = abi.encodePacked(type(FlashLoanVault).creationCode);
        addr_ = DeployUtils.deployContract("FlashLoanVault", _implSalt(), initCode);
    }

    function deployCrosschainFlashLoanToken() public broadcast returns (address addr_) {
        bytes memory initCode = abi.encodePacked(type(CrosschainFlashLoanToken).creationCode);
        addr_ = DeployUtils.deployContract("CrosschainFlashLoanToken", _implSalt(), initCode);
    }

    function deployCrosschainFlashLoanBridge() public broadcast returns (address addr_) {
        address messenger = 0x820e6303D954E083be1d6051EABC97636A7e468A;
        address token = 0x0884244AbBe2cCfDBFD413EE67E818707dA286e7;
        uint256 minGas = 10000000000000000;
        address owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

        bytes memory initCode =
            abi.encodePacked(type(CrosschainFlashLoanBridge).creationCode, abi.encode(messenger, token, minGas, owner));
        addr_ = DeployUtils.deployContract("CrosschainFlashLoanBridge", _implSalt(), initCode);
    }

    function deployTargetContract() public broadcast returns (address addr_) {
        bytes memory initCode = abi.encodePacked(type(TargetContract).creationCode);
        addr_ = DeployUtils.deployContract("TargetContract", _implSalt(), initCode);
    }

    /// @notice The CREATE2 salt to be used when deploying a contract.
    function _implSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(vm.envOr("DEPLOY_SALT", string("ethers phoenix"))));
    }
}
