// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin-contracts/interfaces/IERC20.sol";

contract TargetContract {
    uint256 public lastBalance;

    function setValue(address token) external {
        // store the balance of this contracts balamnce of crosschain token and return that balance in an output variable
        lastBalance = IERC20(token).balanceOf(address(this));
        // transfer the balance to the caller
        IERC20(token).transfer(msg.sender, lastBalance);
    }

    function getValue() external view returns (uint256) {
        return lastBalance;
    }
}
