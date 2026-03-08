// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PurchasePool.sol";
import "../src/MockUSDC.sol";

contract PurchasePoolTest is Test {
    PurchasePool pool;
    MockUSDC     usdc;

    address admin  = address(this);
    address alice  = makeAddr("alice");
    address bob    = makeAddr("bob");
    address carol  = makeAddr("carol");
    address treasury = makeAddr("treasury");

    uint256 constant STARTER_PRICE = 10e6;  // $10 / unit
    uint256 constant BULK_PRICE    =  8e6;  // $8  / unit
    uint256 constant WHOLESALE_PRICE = 7e6; // $7  / unit

    uint256 constant DEADLINE_OFFSET = 7 days;
    uint256 constant FEE_BPS = 250; // 2.5 %

    function setUp() public {
        usdc = new MockUSDC();
        pool = new PurchasePool(FEE_BPS, treasury);

        usdc.mintTo(alice, 50_000e6);
        usdc.mintTo(bob,   50_000e6);
        usdc.mintTo(carol, 50_000e6);
    }

    // Helpers to build tier arrays
    function _tiers3()
        internal
        pure
        returns (
            uint256[] memory mins,
            uint256[] memory prices,
            bool[]    memory mand
        )
    {
        mins   = new uint256[](3);
        prices = new uint256[](3);
        mand   = new bool[](3);

        mins[0] = 1;    prices[0] = STARTER_PRICE;   mand[0] = false;
        mins[1] = 100;  prices[1] = BULK_PRICE;      mand[1] = true;
        mins[2] = 400;  prices[2] = WHOLESALE_PRICE;  mand[2] = true;
    }

    function _createDefaultPool() internal returns (uint256 poolId) {
        (uint256[] memory mins, uint256[] memory prices, bool[] memory mand) = _tiers3();
        poolId = pool.createPool(
            "Espresso Blend Coffee Beans",
            mins, prices, mand,
            block.timestamp + DEADLINE_OFFSET,
            address(usdc)
        );
    }

    // ── Pool creation ───────────────────────────────────────────────────

    function test_createPool() public {
        uint256 poolId = _createDefaultPool();
        assertEq(poolId, 0);
        assertEq(pool.nextPoolId(), 1);

        (
            string memory name,
            uint256 price,
            uint256 moq,
            uint256 deadline,
            address token,
            uint256 totalUnits,
            uint256 totalDeposited,
            PurchasePool.PoolStatus status
        ) = pool.getPool(poolId);

        assertEq(name, "Espresso Blend Coffee Beans");
        assertEq(price, STARTER_PRICE);
        assertEq(moq, 100);
        assertEq(deadline, block.timestamp + DEADLINE_OFFSET);
        assertEq(token, address(usdc));
        assertEq(totalUnits, 0);
        assertEq(totalDeposited, 0);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Open));
    }

    function test_getPoolTiers() public {
        uint256 poolId = _createDefaultPool();
        (uint256[] memory mins, uint256[] memory prices, bool[] memory mand) = pool.getPoolTiers(poolId);
        assertEq(mins.length, 3);
        assertEq(mins[0], 1);
        assertEq(mins[1], 100);
        assertEq(mins[2], 400);
        assertEq(prices[0], STARTER_PRICE);
        assertEq(prices[1], BULK_PRICE);
        assertEq(prices[2], WHOLESALE_PRICE);
        assertFalse(mand[0]);
        assertTrue(mand[1]);
        assertTrue(mand[2]);
    }

    function test_createPool_revertsNonOwner() public {
        (uint256[] memory mins, uint256[] memory prices, bool[] memory mand) = _tiers3();
        vm.prank(alice);
        vm.expectRevert();
        pool.createPool("Test", mins, prices, mand, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsEmptyTiers() public {
        uint256[] memory empty = new uint256[](0);
        bool[] memory emptyB = new bool[](0);
        vm.expectRevert("Invalid tier count");
        pool.createPool("Test", empty, empty, emptyB, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsFirstTierNotOne() public {
        uint256[] memory mins = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        bool[] memory mand = new bool[](1);
        mins[0] = 5; prices[0] = 10e6; mand[0] = true;
        vm.expectRevert("First tier must start at 1");
        pool.createPool("Test", mins, prices, mand, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsUnsortedTiers() public {
        uint256[] memory mins = new uint256[](2);
        uint256[] memory prices = new uint256[](2);
        bool[] memory mand = new bool[](2);
        mins[0] = 1; prices[0] = 10e6; mand[0] = false;
        mins[1] = 1; prices[1] = 8e6;  mand[1] = true;
        vm.expectRevert("Tiers must be sorted ascending");
        pool.createPool("Test", mins, prices, mand, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsNoMandatoryTier() public {
        uint256[] memory mins = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        bool[] memory mand = new bool[](1);
        mins[0] = 1; prices[0] = 10e6; mand[0] = false;
        vm.expectRevert("At least one mandatory tier required");
        pool.createPool("Test", mins, prices, mand, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsPastDeadline() public {
        (uint256[] memory mins, uint256[] memory prices, bool[] memory mand) = _tiers3();
        vm.expectRevert("Deadline must be in the future");
        pool.createPool("Test", mins, prices, mand, block.timestamp - 1, address(usdc));
    }

    // ── Tiered pricing in commit ────────────────────────────────────────

    function test_commit_starterTierPrice() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 50 * STARTER_PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        (uint256 units, uint256 deposited,) = pool.getCommitment(poolId, alice);
        assertEq(units, 50);
        assertEq(deposited, 50 * STARTER_PRICE);
    }

    function test_commit_bulkTierPrice() public {
        uint256 poolId = _createDefaultPool();

        // First commit at starter tier to bring total to 50
        vm.startPrank(alice);
        usdc.approve(address(pool), 200 * STARTER_PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        // Second commit at bulk tier (50 + 60 = 110 >= 100)
        vm.startPrank(bob);
        usdc.approve(address(pool), 60 * BULK_PRICE);
        pool.commit(poolId, 60);
        vm.stopPrank();

        (uint256 units, uint256 deposited,) = pool.getCommitment(poolId, bob);
        assertEq(units, 60);
        assertEq(deposited, 60 * BULK_PRICE);
    }

    function test_commit_wholesaleTierPrice() public {
        // Use a pool with high fulfillment threshold so we can test wholesale without fulfilling early
        uint256[] memory mins   = new uint256[](3);
        uint256[] memory prices = new uint256[](3);
        bool[]    memory mand   = new bool[](3);
        mins[0] = 1;   prices[0] = STARTER_PRICE;   mand[0] = false;
        mins[1] = 100; prices[1] = BULK_PRICE;       mand[1] = false;
        mins[2] = 400; prices[2] = WHOLESALE_PRICE;  mand[2] = true;

        uint256 poolId = pool.createPool(
            "Wholesale Test", mins, prices, mand,
            block.timestamp + DEADLINE_OFFSET, address(usdc)
        );

        // Bring pool to 300 units at bulk price
        vm.startPrank(alice);
        usdc.approve(address(pool), 300 * BULK_PRICE);
        pool.commit(poolId, 300);
        vm.stopPrank();

        // Commit 200 more at wholesale (300 + 200 = 500 >= 400)
        vm.startPrank(bob);
        usdc.approve(address(pool), 200 * WHOLESALE_PRICE);
        pool.commit(poolId, 200);
        vm.stopPrank();

        (uint256 units, uint256 deposited,) = pool.getCommitment(poolId, bob);
        assertEq(units, 200);
        assertEq(deposited, 200 * WHOLESALE_PRICE);
    }

    function test_commit_crossesTierBoundary() public {
        uint256 poolId = _createDefaultPool();

        // Commit 100 units at once: new total = 100 -> bulk tier
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * BULK_PRICE);
        pool.commit(poolId, 100);
        vm.stopPrank();

        (uint256 units, uint256 deposited,) = pool.getCommitment(poolId, alice);
        assertEq(units, 100);
        assertEq(deposited, 100 * BULK_PRICE);
    }

    function test_commitMultipleBuyers() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 40 * STARTER_PRICE);
        pool.commit(poolId, 40);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 30 * STARTER_PRICE);
        pool.commit(poolId, 30);
        vm.stopPrank();

        assertEq(pool.getBuyerCount(poolId), 2);
        assertEq(pool.getBuyer(poolId, 0), alice);
        assertEq(pool.getBuyer(poolId, 1), bob);
    }

    // ── Fulfillment ─────────────────────────────────────────────────────

    function test_fulfillmentAtMandatoryTier() public {
        uint256 poolId = _createDefaultPool();

        // 60 + 50 = 110 >= 100 (first mandatory tier)
        vm.startPrank(alice);
        usdc.approve(address(pool), 60 * STARTER_PRICE);
        pool.commit(poolId, 60);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 50 * BULK_PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        (, , , , , uint256 totalUnits, , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(totalUnits, 110);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Fulfilled));
    }

    function test_noFulfillmentBelowMandatoryTier() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 99 * STARTER_PRICE);
        pool.commit(poolId, 99);
        vm.stopPrank();

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Open));
    }

    function test_withdrawAfterFulfill_withFee() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * BULK_PRICE);
        pool.commit(poolId, 100);
        vm.stopPrank();

        uint256 totalDeposit = 100 * BULK_PRICE;
        uint256 expectedFee = (totalDeposit * FEE_BPS) / 10_000;
        uint256 expectedPayout = totalDeposit - expectedFee;

        uint256 adminBefore = usdc.balanceOf(admin);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        pool.withdrawFunds(poolId);

        assertEq(usdc.balanceOf(admin) - adminBefore, expectedPayout);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, expectedFee);
        assertEq(pool.totalFeesCollected(), expectedFee);

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Withdrawn));
    }

    function test_withdrawRevertsIfNotFulfilled() public {
        uint256 poolId = _createDefaultPool();
        vm.expectRevert("Pool not fulfilled");
        pool.withdrawFunds(poolId);
    }

    // ── Fee configuration ───────────────────────────────────────────────

    function test_initialFeeConfig() public view {
        assertEq(pool.feeBps(), FEE_BPS);
        assertEq(pool.feeRecipient(), treasury);
    }

    function test_setFeeBps() public {
        pool.setFeeBps(500);
        assertEq(pool.feeBps(), 500);
    }

    function test_setFeeBps_revertsExceedsMax() public {
        vm.expectRevert("Fee exceeds max");
        pool.setFeeBps(1001);
    }

    function test_setFeeBps_revertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.setFeeBps(100);
    }

    function test_setFeeRecipient() public {
        pool.setFeeRecipient(alice);
        assertEq(pool.feeRecipient(), alice);
    }

    function test_setFeeRecipient_revertsZeroAddress() public {
        vm.expectRevert("Invalid fee recipient");
        pool.setFeeRecipient(address(0));
    }

    function test_withdrawWithZeroFee() public {
        pool.setFeeBps(0);

        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * BULK_PRICE);
        pool.commit(poolId, 100);
        vm.stopPrank();

        uint256 adminBefore = usdc.balanceOf(admin);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        pool.withdrawFunds(poolId);

        assertEq(usdc.balanceOf(admin) - adminBefore, 100 * BULK_PRICE);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, 0);
    }

    function test_constructorRevertsExcessiveFee() public {
        vm.expectRevert("Fee exceeds max");
        new PurchasePool(1001, treasury);
    }

    function test_constructorRevertsZeroRecipient() public {
        vm.expectRevert("Invalid fee recipient");
        new PurchasePool(250, address(0));
    }

    // ── Expiration & refund ─────────────────────────────────────────────

    function test_expiresAfterDeadline() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 10 * STARTER_PRICE);
        pool.commit(poolId, 10);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Expired));
    }

    function test_claimRefund() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 20 * STARTER_PRICE);
        pool.commit(poolId, 20);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claimRefund(poolId);

        assertEq(usdc.balanceOf(alice) - balBefore, 20 * STARTER_PRICE);
        (, , bool refunded) = pool.getCommitment(poolId, alice);
        assertTrue(refunded);
    }

    function test_doubleRefundReverts() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 20 * STARTER_PRICE);
        pool.commit(poolId, 20);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(alice);
        pool.claimRefund(poolId);

        vm.prank(alice);
        vm.expectRevert("Already refunded");
        pool.claimRefund(poolId);
    }

    function test_refundRevertsIfNotExpired() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 20 * STARTER_PRICE);
        pool.commit(poolId, 20);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert("Pool not expired");
        pool.claimRefund(poolId);
    }

    function test_cannotCommitAfterDeadline() public {
        uint256 poolId = _createDefaultPool();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.startPrank(alice);
        usdc.approve(address(pool), 10 * STARTER_PRICE);
        vm.expectRevert("Pool not open");
        pool.commit(poolId, 10);
        vm.stopPrank();
    }

    // ── Edge cases ──────────────────────────────────────────────────────

    function test_commitZeroUnitsReverts() public {
        uint256 poolId = _createDefaultPool();
        vm.prank(alice);
        vm.expectRevert("Units must be > 0");
        pool.commit(poolId, 0);
    }

    function test_multipleCommitsSameUser() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 200 * STARTER_PRICE);
        pool.commit(poolId, 30);
        pool.commit(poolId, 20);
        vm.stopPrank();

        (uint256 units, uint256 deposited, ) = pool.getCommitment(poolId, alice);
        assertEq(units, 50);
        assertEq(deposited, 50 * STARTER_PRICE);
        assertEq(pool.getBuyerCount(poolId), 1);
    }

    function test_refundNonParticipantReverts() public {
        uint256 poolId = _createDefaultPool();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(carol);
        vm.expectRevert("Nothing to refund");
        pool.claimRefund(poolId);
    }

    function test_feesAccumulateAcrossPools() public {
        uint256 p1 = _createDefaultPool();
        (uint256[] memory mins, uint256[] memory prices, bool[] memory mand) = _tiers3();
        uint256 p2 = pool.createPool("Pool 2", mins, prices, mand, block.timestamp + DEADLINE_OFFSET, address(usdc));

        vm.startPrank(alice);
        usdc.approve(address(pool), 200 * BULK_PRICE);
        pool.commit(p1, 100);
        pool.commit(p2, 100);
        vm.stopPrank();

        pool.withdrawFunds(p1);
        pool.withdrawFunds(p2);

        uint256 feePerPool = (100 * BULK_PRICE * FEE_BPS) / 10_000;
        assertEq(pool.totalFeesCollected(), feePerPool * 2);
        assertEq(usdc.balanceOf(treasury), feePerPool * 2);
    }

    function test_refundIsFullAmount() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 50 * STARTER_PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        uint256 before_ = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claimRefund(poolId);

        assertEq(usdc.balanceOf(alice) - before_, 50 * STARTER_PRICE);
    }

    // ── getActiveTierPrice view ─────────────────────────────────────────

    function test_getActiveTierPrice() public {
        uint256 poolId = _createDefaultPool();

        assertEq(pool.getActiveTierPrice(poolId, 1), STARTER_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 50), STARTER_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 99), STARTER_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 100), BULK_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 200), BULK_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 399), BULK_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 400), WHOLESALE_PRICE);
        assertEq(pool.getActiveTierPrice(poolId, 1000), WHOLESALE_PRICE);
    }

    // ── Single-tier pool (all mandatory) ────────────────────────────────

    function test_singleMandatoryTier() public {
        uint256[] memory mins = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        bool[] memory mand = new bool[](1);
        mins[0] = 1; prices[0] = 5e6; mand[0] = true;

        uint256 poolId = pool.createPool(
            "Simple Pool", mins, prices, mand,
            block.timestamp + DEADLINE_OFFSET, address(usdc)
        );

        (, uint256 price, uint256 moq, , , , , ) = pool.getPool(poolId);
        assertEq(price, 5e6);
        assertEq(moq, 1);

        vm.startPrank(alice);
        usdc.approve(address(pool), 5e6);
        pool.commit(poolId, 1);
        vm.stopPrank();

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Fulfilled));
    }
}
