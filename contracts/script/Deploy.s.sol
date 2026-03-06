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
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC();
        PurchasePool pool = new PurchasePool();

        vm.stopBroadcast();

        console.log("MockUSDC:     ", address(usdc));
        console.log("PurchasePool: ", address(pool));
    }
}
