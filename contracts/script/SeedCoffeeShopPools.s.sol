// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PurchasePool.sol";

/// @notice Seeds the PurchasePool with a full coffee-shop supplier catalogue
///         using on-chain tiered pricing.
///
/// Usage:
///   DEPLOYER_KEY=0x... POOL_ADDRESS=0x... TOKEN_ADDRESS=0x... \
///     forge script script/SeedCoffeeShopPools.s.sol \
///     --rpc-url https://arb-sepolia.g.alchemy.com/v2/... \
///     --broadcast --slow
contract SeedCoffeeShopPools is Script {

    // Reusable tier-array builder for 3-tier pools
    function _t3(
        uint256 m1, uint256 p1, bool d1,
        uint256 m2, uint256 p2, bool d2,
        uint256 m3, uint256 p3, bool d3
    ) internal pure returns (
        uint256[] memory mins,
        uint256[] memory prices,
        bool[]    memory mand
    ) {
        mins   = new uint256[](3);
        prices = new uint256[](3);
        mand   = new bool[](3);
        mins[0] = m1; prices[0] = p1; mand[0] = d1;
        mins[1] = m2; prices[1] = p2; mand[1] = d2;
        mins[2] = m3; prices[2] = p3; mand[2] = d3;
    }

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address poolAddr    = vm.envAddress("POOL_ADDRESS");
        address tokenAddr   = vm.envAddress("TOKEN_ADDRESS");

        PurchasePool pool = PurchasePool(poolAddr);

        uint256 deadline30 = block.timestamp + 30 days;
        uint256 deadline21 = block.timestamp + 21 days;

        vm.startBroadcast(deployerKey);

        // ── COFFEE BEANS ─────────────────────────────────────────────────
        { // 0: Arabica House Blend
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 10e6, false,  75, 8_500000, true,  300, 7_500000, true);
            pool.createPool("Arabica House Blend Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 1: Arabica Espresso Blend
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 11e6, false,  60, 9_350000, true,  250, 8_250000, true);
            pool.createPool("Arabica Espresso Blend Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 2: Ethiopian Single-Origin (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 10_800000, false,  80, 8_980000, true,  400, 8_080000, true);
            pool.createPool("Ethiopian Single-Origin Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 3: Colombian Single-Origin (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 8_400000, false,  60, 7_140000, true,  250, 6_300000, true);
            pool.createPool("Colombian Single-Origin Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 4: Guatemalan Single-Origin
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 13e6, false,  60, 11_050000, true,  250, 9_750000, true);
            pool.createPool("Guatemalan Single-Origin Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 5: Kenyan Single-Origin (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 10_800000, false,  50, 9_180000, true,  200, 8_100000, true);
            pool.createPool("Kenyan Single-Origin Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 6: Costa Rican Single-Origin
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 16e6, false,  50, 13_600000, true,  200, 12e6, true);
            pool.createPool("Costa Rican Single-Origin Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 7: Light Roast
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 12e6, false,  75, 10_200000, true,  300, 9e6, true);
            pool.createPool("Light Roast Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 8: Medium Roast
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 10e6, false,  100, 8_500000, true,  400, 7_500000, true);
            pool.createPool("Medium Roast Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 9: Dark / French Roast
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 10e6, false,  100, 8_500000, true,  400, 7_500000, true);
            pool.createPool("Dark / French Roast Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 10: Decaf Swiss Water Process
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 9_600000, false,  50, 8_160000, true,  200, 7_200000, true);
            pool.createPool("Decaf Swiss Water Process Coffee Beans", m, p, d, deadline30, tokenAddr);
        }
        { // 11: Green Unroasted
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 6e6, false,  100, 5_100000, true,  400, 4_500000, true);
            pool.createPool("Green Unroasted Coffee Beans", m, p, d, deadline30, tokenAddr);
        }

        // ── CUPS & LIDS ──────────────────────────────────────────────────
        { // 12: Hot Paper Cups 12oz (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 48e6, false,  25, 40e6, true,  100, 36e6, true);
            pool.createPool("Hot Paper Cups 12oz (1000/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 13: Hot Paper Cups 16oz
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 57e6, false,  20, 47_500000, true,  80, 42_750000, true);
            pool.createPool("Hot Paper Cups 16oz (1000/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 14: Cold Clear Cups 16oz
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 70e6, false,  25, 59_500000, true,  100, 52_500000, true);
            pool.createPool("Cold Clear Cups 16oz (1000/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 15: Compostable Hot Cups 12oz
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 90e6, false,  20, 76_500000, true,  80, 67_500000, true);
            pool.createPool("Compostable Hot Cups 12oz (500/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 16: Flat Lids
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 40e6, false,  40, 34e6, true,  150, 30e6, true);
            pool.createPool("Flat Lids for 12-16oz Cups (1000/case)", m, p, d, deadline21, tokenAddr);
        }

        // ── TO-GO CONTAINERS & BOXES ─────────────────────────────────────
        { // 17: 3-Compartment Clamshell Boxes (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 21e6, false,  50, 17_500000, true,  200, 15_750000, true);
            pool.createPool("3-Compartment Clamshell Boxes (200/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 18: Deli Soup Containers
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 30e6, false,  50, 25_500000, true,  200, 22_500000, true);
            pool.createPool("Deli Soup Containers 32oz w/Lids (250/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 19: Aluminum Foil Pans
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 25e6, false,  60, 21_250000, true,  250, 18_750000, true);
            pool.createPool("Aluminum Foil Pans Half-Size (100/case)", m, p, d, deadline21, tokenAddr);
        }

        // ── UTENSILS & NAPKINS ───────────────────────────────────────────
        { // 20: Compostable Cutlery Kits (ACTIVE)
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 12e6, false,  75, 9_600000, true,  300, 8_400000, true);
            pool.createPool("Compostable Cutlery Kits (250/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 21: Bulk Napkins
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 35e6, false,  50, 29_750000, true,  200, 26_250000, true);
            pool.createPool("Bulk Napkins (8000/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 22: Eco Paper Straws
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 15e6, false,  100, 12_750000, true,  400, 11_250000, true);
            pool.createPool("Eco Paper Straws (500/case)", m, p, d, deadline21, tokenAddr);
        }

        // ── BAGS & WRAPS ─────────────────────────────────────────────────
        { // 23: Kraft Paper Bags
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 40e6, false,  40, 34e6, true,  150, 30e6, true);
            pool.createPool("Kraft Paper Carry-Out Bags (500/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 24: Takeout Bags
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 25e6, false,  60, 21_250000, true,  250, 18_750000, true);
            pool.createPool("Takeout Bags with Handles (250/case)", m, p, d, deadline21, tokenAddr);
        }
        { // 25: Foil & Parchment Wrap
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 20e6, false,  80, 17e6, true,  300, 15e6, true);
            pool.createPool("Foil & Parchment Food Wrap Rolls", m, p, d, deadline21, tokenAddr);
        }

        vm.stopBroadcast();

        console.log("Seeded 26 tiered-pricing pools.");
        console.log("  30-day deadline:", deadline30);
        console.log("  21-day deadline:", deadline21);
    }
}
