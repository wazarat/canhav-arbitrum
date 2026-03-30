// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PurchasePool.sol";

/// @notice Seeds pools across all 7 industry niches beyond the coffee-shop catalogue.
///         Run AFTER SeedCoffeeShopPools if you want the full set.
///
/// Usage:
///   DEPLOYER_KEY=0x... POOL_ADDRESS=0x... TOKEN_ADDRESS=0x... \
///     forge script script/SeedAllIndustryPools.s.sol \
///     --rpc-url https://arb-sepolia.g.alchemy.com/v2/... \
///     --broadcast --slow
contract SeedAllIndustryPools is Script {

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

        // ── BARBERSHOP SUPPLIES ─────────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 18e6, false,  10, 14_400000, true,  50, 12_600000, true);
            pool.createPool("Andis Professional Clipper Blades (10-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 24e6, false,  20, 19_200000, true,  80, 16_800000, true);
            pool.createPool("Barbicide Disinfectant Concentrate (64oz)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 15e6, false,  30, 12e6, true,  100, 10_500000, true);
            pool.createPool("Disposable Neck Strips (1200/case)", m, p, d, deadline21, tokenAddr);
        }

        // ── AUTO DETAILING SUPPLIES ─────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 85e6, false,  12, 68e6, true,  50, 59_500000, true);
            pool.createPool("Ceramic Coating Pro Kit (12-unit case)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 32e6, false,  20, 25_600000, true,  80, 22_400000, true);
            pool.createPool("Microfiber Towels 400GSM (200-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 28e6, false,  15, 22_400000, true,  60, 19_600000, true);
            pool.createPool("Dual-Action Polishing Compound (1gal, 4/case)", m, p, d, deadline21, tokenAddr);
        }

        // ── LEGAL & OFFICE SUPPLIES ─────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 45e6, false,  20, 36e6, true,  100, 31_500000, true);
            pool.createPool("Copy Paper 8.5x11 (10-ream case)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 38e6, false,  10, 30_400000, true,  50, 26_600000, true);
            pool.createPool("Printer Toner Cartridges (HP Universal, 4-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 22e6, false,  25, 17_600000, true,  100, 15_400000, true);
            pool.createPool("File Folders Letter Size (500/box)", m, p, d, deadline21, tokenAddr);
        }

        // ── MARKETING & AD TOOLS ────────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 500e6, false,  5, 425e6, true,  20, 375e6, true);
            pool.createPool("Meta Ad Credits ($500 bundle)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 500e6, false,  5, 425e6, true,  20, 375e6, true);
            pool.createPool("Google Ads Credits ($500 bundle)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 120e6, false,  5, 96e6, true,  15, 84e6, true);
            pool.createPool("Stock Photo Annual License (10-seat team)", m, p, d, deadline30, tokenAddr);
        }

        // ── REAL ESTATE SUPPLIES ────────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 35e6, false,  10, 28e6, true,  50, 24_500000, true);
            pool.createPool("Open House Sign Riders (50-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 75e6, false,  10, 60e6, true,  30, 52_500000, true);
            pool.createPool("Professional Listing Photography Package", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 60e6, false,  5, 48e6, true,  20, 42e6, true);
            pool.createPool("Virtual Staging Credits (20-listing bundle)", m, p, d, deadline21, tokenAddr);
        }

        // ── YOGA & WELLNESS SUPPLIES ────────────────────────────────────
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 42e6, false,  12, 33_600000, true,  48, 29_400000, true);
            pool.createPool("Premium Yoga Mats 6mm (24-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 28e6, false,  20, 22_400000, true,  80, 19_600000, true);
            pool.createPool("Cork Yoga Blocks (48-pack)", m, p, d, deadline30, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 18e6, false,  15, 14_400000, true,  60, 12_600000, true);
            pool.createPool("Mat Sanitizer Spray (1gal, 4/case)", m, p, d, deadline21, tokenAddr);
        }

        vm.stopBroadcast();
    }
}
