// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SuperchainERC20} from "@interop-lib/SuperchainERC20.sol";

contract CrosschainFlashLoanToken is SuperchainERC20 {
    string private constant _name = "XChainFlashLoan";
    string private constant _symbol = "CXL";
    uint8 private constant _decimals = 18;

    function name() public pure override returns (string memory) {
        return _name;
    }

    function symbol() public pure override returns (string memory) {
        return _symbol;
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    function mint(address to_, uint256 amount_) external {
        _mint(to_, amount_);
    }
}
