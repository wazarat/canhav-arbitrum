// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PurchasePool.sol";

/// @notice Legacy seed script — kept for reference. Use SeedCoffeeShopPools.s.sol instead.
contract SeedPools is Script {
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
        uint256 deadline  = block.timestamp + 14 days;

        vm.startBroadcast(deployerKey);

        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 15e6, false,  50, 12_750000, true,  200, 11_250000, true);
            pool.createPool("Espresso Blend Coffee Beans", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 18e6, false,  40, 15_300000, true,  150, 13_500000, true);
            pool.createPool("Ethiopian Single-Origin Beans", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 3e6, false,  100, 2_550000, true,  500, 2_250000, true);
            pool.createPool("All-Purpose Flour", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 7_200000, false,  40, 6_120000, true,  150, 5_400000, true);
            pool.createPool("Olive Oil", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 8e6, false,  75, 6_800000, true,  300, 6e6, true);
            pool.createPool("Basmati Rice", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 1_200000, false,  250, 1e6, true,  1000, 900000, true);
            pool.createPool("Hot Cups", m, p, d, deadline, tokenAddr);
        }
        {
            (uint256[] memory m, uint256[] memory p, bool[] memory d) =
                _t3(1, 1e6, false,  250, 850000, true,  1000, 750000, true);
            pool.createPool("Lids", m, p, d, deadline, tokenAddr);
        }

        vm.stopBroadcast();

        console.log("Seeded 7 legacy pools with deadline:", deadline);
    }
}
