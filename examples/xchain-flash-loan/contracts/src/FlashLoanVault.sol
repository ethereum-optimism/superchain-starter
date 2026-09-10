// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin-contracts/interfaces/IERC20.sol";

/// @title FlashLoanVault
/// @notice A vault that provides flash loans where borrowing and repayment must occur in the same block,
/// or the funds can be reclaimed after a timeout
contract FlashLoanVault {
    struct Loan {
        address token;
        uint256 amount;
        address owner;
        address borrower;
        uint256 timeout;
        bool isActive;
    }

    // Loan ID => Loan details
    mapping(bytes32 => Loan) public loans;

    event LoanCreated(
        bytes32 indexed loanId, address indexed token, uint256 amount, address owner, address borrower, uint256 timeout
    );
    event LoanRepaid(bytes32 indexed loanId, address indexed repayer);
    event LoanClaimed(bytes32 indexed loanId, address indexed borrower);
    event LoanReclaimed(bytes32 indexed loanId, address indexed reclaimer);

    error LoanNotActive();
    error NotAuthorized();
    error TransferFailed();
    error CallFailed();
    error TimeoutNotElapsed();
    error InsufficientBalance();
    /// @notice Create a new flash loan
    /// @param token The token to be loaned
    /// @param amount The amount to be loaned
    /// @param borrower The address that can claim the loan
    /// @param timeout The duration after which the loan can be reclaimed
    /// @return loanId The unique identifier for this loan

    function createLoan(address token, uint256 amount, address borrower, uint256 timeout)
        external
        returns (bytes32 loanId)
    {
        if (IERC20(token).balanceOf(msg.sender) < amount) revert InsufficientBalance();

        // Transfer tokens to this contract
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        // Generate loan ID
        loanId = keccak256(abi.encodePacked(token, amount, msg.sender, borrower, timeout, block.timestamp));

        // Store loan details
        loans[loanId] = Loan({
            token: token,
            amount: amount,
            owner: msg.sender,
            borrower: borrower,
            timeout: block.timestamp + timeout,
            isActive: true
        });

        emit LoanCreated(loanId, token, amount, msg.sender, borrower, timeout);
    }

    /// @notice Execute a flash loan with an arbitrary call
    /// @param loanId The ID of the loan to execute
    /// @param target The contract to call with the borrowed funds
    /// @param data The calldata to execute on the target contract
    function executeFlashLoan(bytes32 loanId, address target, bytes calldata data) external {
        Loan storage loan = loans[loanId];
        if (!loan.isActive) revert LoanNotActive();
        if (msg.sender != loan.borrower) revert NotAuthorized();
        if (block.timestamp > loan.timeout) revert TimeoutNotElapsed();

        // Transfer tokens to target
        bool success = IERC20(loan.token).transfer(target, loan.amount);
        if (!success) revert TransferFailed();

        emit LoanClaimed(loanId, loan.borrower);

        // Make the arbitrary call
        (success,) = target.call(data);
        if (!success) revert CallFailed();

        // Check that loan was repaid
        uint256 balance = IERC20(loan.token).balanceOf(address(this));
        if (balance < loan.amount) revert TransferFailed();

        // Transfer tokens back to owner
        success = IERC20(loan.token).transfer(loan.owner, loan.amount);
        if (!success) revert TransferFailed();

        loan.isActive = false;
        emit LoanRepaid(loanId, msg.sender);
    }

    /// @notice Reclaim tokens after timeout has elapsed
    /// @param loanId The ID of the loan to reclaim
    function reclaimExpiredLoan(bytes32 loanId) external {
        Loan storage loan = loans[loanId];
        if (!loan.isActive) revert LoanNotActive();
        if (block.timestamp <= loan.timeout) revert TimeoutNotElapsed();

        // Transfer all tokens back to owner
        uint256 balance = IERC20(loan.token).balanceOf(address(this));
        bool success = IERC20(loan.token).transfer(loan.owner, balance);
        if (!success) revert TransferFailed();

        loan.isActive = false;
        emit LoanReclaimed(loanId, msg.sender);
    }
}
