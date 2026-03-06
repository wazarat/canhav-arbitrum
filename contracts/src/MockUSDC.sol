// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — test stablecoin for the Group Purchase Pool
/// @notice Anyone can mint tokens to themselves for testing on Arbitrum Sepolia.
contract MockUSDC is ERC20 {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Mint `amount` tokens (in smallest unit) to the caller.
    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /// @notice Mint `amount` tokens to an arbitrary address (useful for tests).
    function mintTo(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
