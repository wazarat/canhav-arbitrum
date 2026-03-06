// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PurchasePool.sol";

/// @notice Seeds the PurchasePool contract with initial product pools.
/// Usage:
///   DEPLOYER_KEY=... POOL_ADDRESS=... forge script script/SeedPools.s.sol \
///     --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
///     --broadcast --slow
contract SeedPools is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address poolAddr    = vm.envAddress("POOL_ADDRESS");
        address tokenAddr   = vm.envAddress("TOKEN_ADDRESS");

        PurchasePool pool = PurchasePool(poolAddr);
        uint256 deadline  = block.timestamp + 14 days;

        vm.startBroadcast(deployerKey);

        pool.createPool("Espresso Blend Coffee Beans",  15e6, 50,  deadline, tokenAddr);
        pool.createPool("Ethiopian Single-Origin Beans", 18e6, 40,  deadline, tokenAddr);
        pool.createPool("All-Purpose Flour",             5e6,  200, deadline, tokenAddr);
        pool.createPool("Olive Oil",                     12e6, 80,  deadline, tokenAddr);
        pool.createPool("Basmati Rice",                  8e6,  150, deadline, tokenAddr);
        pool.createPool("Hot Cups",                      2e6,  500, deadline, tokenAddr);
        pool.createPool("Lids",                          1e6,  500, deadline, tokenAddr);

        vm.stopBroadcast();

        console.log("Seeded 7 pools with deadline:", deadline);
    }
}
