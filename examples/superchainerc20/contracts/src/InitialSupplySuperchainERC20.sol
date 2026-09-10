// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SuperchainERC20} from "@interop-lib/SuperchainERC20.sol";
import {Ownable} from "@solady/auth/Ownable.sol";

contract InitialSupplySuperchainERC20 is SuperchainERC20, Ownable {
    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    constructor(
        address owner_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        uint256 initialSupplyChainId_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        _initializeOwner(owner_);

        if (initialSupplyChainId_ == block.chainid) {
            _mint(owner_, initialSupply_);
        }
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
