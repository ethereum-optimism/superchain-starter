// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { Vm } from "forge-std/Vm.sol";
import {console} from "forge-std/console.sol";
import {ICreateX} from "createx/ICreateX.sol";

library DeployUtils {
     Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    /// @notice Address of the CreateX predeploy.
    address internal constant CreateX = 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed;

    /// @notice Checks if a contract is already deployed and returns the address if it is.
    /// @param _salt The salt to use for the deployment.
    /// @param _initCode The init code of the contract to deploy.
    function checkIfContractAlreadyDeployed(
        bytes32 _salt,
        bytes memory _initCode
    )
        internal
        view
        returns (address payable addr_)
    {
        address preComputedAddress = ICreateX(CreateX).computeCreate2Address(keccak256(abi.encode(_salt)), keccak256(_initCode));
        if (preComputedAddress.code.length > 0) {
            addr_ = payable(preComputedAddress);
        }
    }

    function deployContract(string memory _contractName, bytes32 _salt, bytes memory _initCode) internal returns (address addr_) {
        addr_ = checkIfContractAlreadyDeployed(_salt, _initCode);
        if (addr_ != address(0)) {
            console.log("%s already deployed at %s on chain id: %s", _contractName, addr_, block.chainid);
        } else {
            addr_ = ICreateX(CreateX).deployCreate2(_salt, _initCode);
            console.log("Deployed %s at address: %s on chain id: %s", _contractName, addr_, block.chainid);
        }
    }
}
