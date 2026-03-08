// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/PurchasePool.sol";

/// @notice Deploys MockUSDC + PurchasePool to Arbitrum Sepolia.
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
///     --broadcast --slow \
///     -vvvv
/// Set DEPLOYER_KEY env var to your deployer private key.
/// Optionally set FEE_BPS (default 250 = 2.5 %) and FEE_RECIPIENT.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);

        uint256 feeBps = vm.envOr("FEE_BPS", uint256(250));
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC();
        PurchasePool pool = new PurchasePool(feeBps, feeRecipient);

        vm.stopBroadcast();

        console.log("MockUSDC:       ", address(usdc));
        console.log("PurchasePool:   ", address(pool));
        console.log("Fee BPS:        ", feeBps);
        console.log("Fee Recipient:  ", feeRecipient);
    }
}
