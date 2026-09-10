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
            address vault = deployFlashLoanVault();
            address token = deployCrosschainFlashLoanToken();
            deployCrosschainFlashLoanBridge(token, vault);
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

    // Takes the addresses deployed above rather than constants. The constructor is
    // (token, vault, flatFee, owner), and the constants this used to pass were a
    // messenger and a token, in the token and vault slots.
    function deployCrosschainFlashLoanBridge(address _token, address _vault) public broadcast returns (address addr_) {
        uint256 flatFee = 0.01 ether;
        address owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

        bytes memory initCode =
            abi.encodePacked(type(CrosschainFlashLoanBridge).creationCode, abi.encode(_token, _vault, flatFee, owner));
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
