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

    uint256 constant PRICE  = 10e6;   // 10 USDC per unit
    uint256 constant MOQ    = 100;    // 100 units minimum
    uint256 constant DEADLINE_OFFSET = 7 days;

    function setUp() public {
        usdc = new MockUSDC();
        pool = new PurchasePool();

        usdc.mintTo(alice, 5000e6);
        usdc.mintTo(bob,   5000e6);
        usdc.mintTo(carol, 5000e6);
    }

    function _createDefaultPool() internal returns (uint256 poolId) {
        poolId = pool.createPool(
            "Espresso Blend Coffee Beans",
            PRICE,
            MOQ,
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
        assertEq(price, PRICE);
        assertEq(moq, MOQ);
        assertEq(deadline, block.timestamp + DEADLINE_OFFSET);
        assertEq(token, address(usdc));
        assertEq(totalUnits, 0);
        assertEq(totalDeposited, 0);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Open));
    }

    function test_createPool_revertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        pool.createPool("Test", PRICE, MOQ, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsZeroPrice() public {
        vm.expectRevert("Price must be > 0");
        pool.createPool("Test", 0, MOQ, block.timestamp + 1 days, address(usdc));
    }

    function test_createPool_revertsPastDeadline() public {
        vm.expectRevert("Deadline must be in the future");
        pool.createPool("Test", PRICE, MOQ, block.timestamp - 1, address(usdc));
    }

    // ── Commit ──────────────────────────────────────────────────────────

    function test_commit() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 50 * PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        (uint256 units, uint256 deposited, bool refunded) = pool.getCommitment(poolId, alice);
        assertEq(units, 50);
        assertEq(deposited, 50 * PRICE);
        assertFalse(refunded);

        (, , , , , uint256 totalUnits, , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(totalUnits, 50);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Open));
    }

    function test_commitMultipleBuyers() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 40 * PRICE);
        pool.commit(poolId, 40);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 30 * PRICE);
        pool.commit(poolId, 30);
        vm.stopPrank();

        assertEq(pool.getBuyerCount(poolId), 2);
        assertEq(pool.getBuyer(poolId, 0), alice);
        assertEq(pool.getBuyer(poolId, 1), bob);
    }

    // ── Fulfillment ─────────────────────────────────────────────────────

    function test_fulfillment() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 60 * PRICE);
        pool.commit(poolId, 60);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 50 * PRICE);
        pool.commit(poolId, 50);
        vm.stopPrank();

        (, , , , , uint256 totalUnits, , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(totalUnits, 110);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Fulfilled));
    }

    function test_withdrawAfterFulfill() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), MOQ * PRICE);
        pool.commit(poolId, MOQ);
        vm.stopPrank();

        uint256 adminBefore = usdc.balanceOf(admin);
        pool.withdrawFunds(poolId);
        uint256 adminAfter = usdc.balanceOf(admin);

        assertEq(adminAfter - adminBefore, MOQ * PRICE);

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Withdrawn));
    }

    function test_withdrawRevertsIfNotFulfilled() public {
        uint256 poolId = _createDefaultPool();
        vm.expectRevert("Pool not fulfilled");
        pool.withdrawFunds(poolId);
    }

    // ── Expiration & refund ─────────────────────────────────────────────

    function test_expiresAfterDeadline() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 10 * PRICE);
        pool.commit(poolId, 10);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        (, , , , , , , PurchasePool.PoolStatus status) = pool.getPool(poolId);
        assertEq(uint8(status), uint8(PurchasePool.PoolStatus.Expired));
    }

    function test_claimRefund() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 20 * PRICE);
        pool.commit(poolId, 20);
        vm.stopPrank();

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        uint256 balBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        pool.claimRefund(poolId);

        uint256 balAfter = usdc.balanceOf(alice);
        assertEq(balAfter - balBefore, 20 * PRICE);

        (, , bool refunded) = pool.getCommitment(poolId, alice);
        assertTrue(refunded);
    }

    function test_doubleRefundReverts() public {
        uint256 poolId = _createDefaultPool();

        vm.startPrank(alice);
        usdc.approve(address(pool), 20 * PRICE);
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
        usdc.approve(address(pool), 20 * PRICE);
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
        usdc.approve(address(pool), 10 * PRICE);
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
        usdc.approve(address(pool), 200 * PRICE);
        pool.commit(poolId, 30);
        pool.commit(poolId, 20);
        vm.stopPrank();

        (uint256 units, uint256 deposited, ) = pool.getCommitment(poolId, alice);
        assertEq(units, 50);
        assertEq(deposited, 50 * PRICE);

        assertEq(pool.getBuyerCount(poolId), 1);
    }

    function test_refundNonParticipantReverts() public {
        uint256 poolId = _createDefaultPool();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(carol);
        vm.expectRevert("Nothing to refund");
        pool.claimRefund(poolId);
    }
}
