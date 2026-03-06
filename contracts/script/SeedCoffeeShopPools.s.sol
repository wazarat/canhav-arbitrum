// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PurchasePool.sol";

/// @notice Seeds the PurchasePool with a full coffee-shop supplier catalogue.
///         pricePerUnit is in USDC (6 decimals), e.g. 10e6 = $10.00/unit.
///
/// Usage:
///   DEPLOYER_KEY=0x... POOL_ADDRESS=0x... TOKEN_ADDRESS=0x... \
///     forge script script/SeedCoffeeShopPools.s.sol \
///     --rpc-url https://arb-sepolia.g.alchemy.com/v2/... \
///     --broadcast --slow
contract SeedCoffeeShopPools is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address poolAddr    = vm.envAddress("POOL_ADDRESS");
        address tokenAddr   = vm.envAddress("TOKEN_ADDRESS");

        PurchasePool pool = PurchasePool(poolAddr);

        uint256 deadline30 = block.timestamp + 30 days;
        uint256 deadline21 = block.timestamp + 21 days;

        vm.startBroadcast(deployerKey);

        // ── COFFEE BEANS ─────────────────────────────────────────────────
        // Arabica Blends (unit = 1 lb bag)
        pool.createPool("Arabica House Blend Coffee Beans",         10e6, 100, deadline30, tokenAddr);
        pool.createPool("Arabica Espresso Blend Coffee Beans",      11e6,  90, deadline30, tokenAddr);

        // Single-Origin / Specialty (unit = 1 lb bag)
        pool.createPool("Ethiopian Single-Origin Coffee Beans",     18e6,  50, deadline30, tokenAddr);
        pool.createPool("Colombian Single-Origin Coffee Beans",     14e6,  60, deadline30, tokenAddr);
        pool.createPool("Guatemalan Single-Origin Coffee Beans",    13e6,  60, deadline30, tokenAddr);
        pool.createPool("Kenyan Single-Origin Coffee Beans",        18e6,  50, deadline30, tokenAddr);
        pool.createPool("Costa Rican Single-Origin Coffee Beans",   16e6,  50, deadline30, tokenAddr);

        // Roast Levels (unit = 1 lb bag)
        pool.createPool("Light Roast Coffee Beans",                 12e6,  75, deadline30, tokenAddr);
        pool.createPool("Medium Roast Coffee Beans",                10e6, 100, deadline30, tokenAddr);
        pool.createPool("Dark / French Roast Coffee Beans",         10e6, 100, deadline30, tokenAddr);

        // Specialty (unit = 1 lb bag)
        pool.createPool("Decaf Swiss Water Process Coffee Beans",   16e6,  50, deadline30, tokenAddr);
        pool.createPool("Green Unroasted Coffee Beans",              6e6, 200, deadline30, tokenAddr);

        // ── CUPS & LIDS ──────────────────────────────────────────────────
        // unit = 1 case
        pool.createPool("Hot Paper Cups 12oz (1000/case)",          80e6,  25, deadline21, tokenAddr);
        pool.createPool("Hot Paper Cups 16oz (1000/case)",          95e6,  20, deadline21, tokenAddr);
        pool.createPool("Cold Clear Cups 16oz (1000/case)",         70e6,  25, deadline21, tokenAddr);
        pool.createPool("Compostable Hot Cups 12oz (500/case)",     90e6,  20, deadline21, tokenAddr);
        pool.createPool("Flat Lids for 12-16oz Cups (1000/case)",   40e6,  40, deadline21, tokenAddr);

        // ── TO-GO CONTAINERS & BOXES ─────────────────────────────────────
        // unit = 1 case
        pool.createPool("3-Compartment Clamshell Boxes (200/case)", 35e6,  50, deadline21, tokenAddr);
        pool.createPool("Deli Soup Containers 32oz w/Lids (250/case)", 30e6, 50, deadline21, tokenAddr);
        pool.createPool("Aluminum Foil Pans Half-Size (100/case)",  25e6,  60, deadline21, tokenAddr);

        // ── UTENSILS & NAPKINS ───────────────────────────────────────────
        // unit = 1 case
        pool.createPool("Compostable Cutlery Kits (250/case)",      20e6,  75, deadline21, tokenAddr);
        pool.createPool("Bulk Napkins (8000/case)",                  35e6,  50, deadline21, tokenAddr);
        pool.createPool("Eco Paper Straws (500/case)",               15e6, 100, deadline21, tokenAddr);

        // ── BAGS & WRAPS ─────────────────────────────────────────────────
        // unit = 1 case / 1 roll
        pool.createPool("Kraft Paper Carry-Out Bags (500/case)",    40e6,  40, deadline21, tokenAddr);
        pool.createPool("Takeout Bags with Handles (250/case)",     25e6,  60, deadline21, tokenAddr);
        pool.createPool("Foil & Parchment Food Wrap Rolls",         20e6,  80, deadline21, tokenAddr);

        vm.stopBroadcast();

        console.log("Seeded 26 coffee-shop pools.");
        console.log("  30-day deadline:", deadline30);
        console.log("  21-day deadline:", deadline21);
    }
}
