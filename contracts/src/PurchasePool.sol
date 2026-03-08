// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PurchasePool — collaborative group-purchasing escrow
/// @notice Businesses pool ERC-20 commitments toward a supplier MOQ.
///         If the MOQ is met the admin can withdraw funds; otherwise
///         every buyer can reclaim their deposit after the deadline.
///         A configurable platform fee (basis points) is deducted on withdrawal.
contract PurchasePool is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_FEE_BPS = 1000; // 10 % hard cap

    enum PoolStatus { Open, Fulfilled, Expired, Withdrawn }

    struct Pool {
        string   productName;
        uint256  pricePerUnit;   // ERC-20 smallest-unit cost per 1 product unit
        uint256  moq;            // minimum order quantity (units)
        uint256  deadline;       // block.timestamp after which pool can expire
        IERC20   token;          // accepted payment token
        uint256  totalUnits;     // total units committed so far
        uint256  totalDeposited; // total tokens deposited
        PoolStatus status;
    }

    struct Commitment {
        uint256 units;
        uint256 deposited;
        bool    refunded;
    }

    uint256 public nextPoolId;
    uint256 public feeBps;          // platform fee in basis points (e.g. 250 = 2.5 %)
    address public feeRecipient;    // address that receives the platform fee
    uint256 public totalFeesCollected; // running total across all pools

    mapping(uint256 => Pool) public pools;
    // poolId => buyer => commitment
    mapping(uint256 => mapping(address => Commitment)) public commitments;
    // poolId => list of buyer addresses (for enumeration)
    mapping(uint256 => address[]) public poolBuyers;
    mapping(uint256 => mapping(address => bool)) private _isBuyer;

    // ── Events ──────────────────────────────────────────────────────────
    event PoolCreated(
        uint256 indexed poolId,
        string  productName,
        uint256 pricePerUnit,
        uint256 moq,
        uint256 deadline,
        address token
    );
    event Committed(
        uint256 indexed poolId,
        address indexed buyer,
        uint256 units,
        uint256 amount
    );
    event PoolFulfilled(uint256 indexed poolId, uint256 totalUnits);
    event PoolExpired(uint256 indexed poolId);
    event Refunded(
        uint256 indexed poolId,
        address indexed buyer,
        uint256 amount
    );
    event FundsWithdrawn(uint256 indexed poolId, uint256 amount, uint256 fee);
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    /// @param _feeBps     Initial platform fee in basis points (250 = 2.5 %)
    /// @param _feeRecipient Address that receives platform fees
    constructor(uint256 _feeBps, address _feeRecipient) Ownable(msg.sender) {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds max");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
    }

    // ── Admin ───────────────────────────────────────────────────────────

    /// @notice Update the platform fee (capped at MAX_FEE_BPS).
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds max");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    /// @notice Update the fee recipient address.
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    /// @notice Create a new purchase pool.
    function createPool(
        string  calldata productName,
        uint256 pricePerUnit,
        uint256 moq,
        uint256 deadline,
        address token
    ) external onlyOwner returns (uint256 poolId) {
        require(pricePerUnit > 0, "Price must be > 0");
        require(moq > 0, "MOQ must be > 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(token != address(0), "Invalid token");

        poolId = nextPoolId++;
        pools[poolId] = Pool({
            productName:   productName,
            pricePerUnit:  pricePerUnit,
            moq:           moq,
            deadline:      deadline,
            token:         IERC20(token),
            totalUnits:    0,
            totalDeposited:0,
            status:        PoolStatus.Open
        });

        emit PoolCreated(poolId, productName, pricePerUnit, moq, deadline, token);
    }

    /// @notice Withdraw funds from a fulfilled pool (admin only).
    ///         A platform fee is deducted and sent to feeRecipient.
    function withdrawFunds(uint256 poolId) external onlyOwner {
        Pool storage pool = pools[poolId];
        _refreshStatus(poolId);
        require(pool.status == PoolStatus.Fulfilled, "Pool not fulfilled");

        uint256 amount = pool.totalDeposited;
        pool.status = PoolStatus.Withdrawn;

        uint256 fee = (amount * feeBps) / 10_000;
        uint256 payout = amount - fee;

        if (fee > 0) {
            pool.token.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }
        pool.token.safeTransfer(msg.sender, payout);

        emit FundsWithdrawn(poolId, payout, fee);
    }

    // ── Buyer ───────────────────────────────────────────────────────────

    /// @notice Commit `units` to a pool. Caller must have approved
    ///         `units * pricePerUnit` of the pool's token beforehand.
    function commit(uint256 poolId, uint256 units) external {
        require(units > 0, "Units must be > 0");

        Pool storage pool = pools[poolId];
        _refreshStatus(poolId);
        require(pool.status == PoolStatus.Open, "Pool not open");

        uint256 cost = units * pool.pricePerUnit;
        pool.token.safeTransferFrom(msg.sender, address(this), cost);

        Commitment storage c = commitments[poolId][msg.sender];
        c.units     += units;
        c.deposited += cost;

        pool.totalUnits    += units;
        pool.totalDeposited += cost;

        if (!_isBuyer[poolId][msg.sender]) {
            poolBuyers[poolId].push(msg.sender);
            _isBuyer[poolId][msg.sender] = true;
        }

        emit Committed(poolId, msg.sender, units, cost);

        if (pool.totalUnits >= pool.moq) {
            pool.status = PoolStatus.Fulfilled;
            emit PoolFulfilled(poolId, pool.totalUnits);
        }
    }

    /// @notice Reclaim deposit from an expired pool.
    function claimRefund(uint256 poolId) external {
        Pool storage pool = pools[poolId];
        _refreshStatus(poolId);
        require(pool.status == PoolStatus.Expired, "Pool not expired");

        Commitment storage c = commitments[poolId][msg.sender];
        require(c.deposited > 0, "Nothing to refund");
        require(!c.refunded, "Already refunded");

        c.refunded = true;
        uint256 amount = c.deposited;

        pool.token.safeTransfer(msg.sender, amount);
        emit Refunded(poolId, msg.sender, amount);
    }

    // ── Views ───────────────────────────────────────────────────────────

    function getPool(uint256 poolId) external view returns (
        string  memory productName,
        uint256 pricePerUnit,
        uint256 moq,
        uint256 deadline,
        address token,
        uint256 totalUnits,
        uint256 totalDeposited,
        PoolStatus status
    ) {
        Pool storage p = pools[poolId];
        PoolStatus s = p.status;
        if (s == PoolStatus.Open && block.timestamp > p.deadline) {
            s = PoolStatus.Expired;
        }
        return (
            p.productName,
            p.pricePerUnit,
            p.moq,
            p.deadline,
            address(p.token),
            p.totalUnits,
            p.totalDeposited,
            s
        );
    }

    function getCommitment(uint256 poolId, address buyer) external view returns (
        uint256 units,
        uint256 deposited,
        bool    refunded
    ) {
        Commitment storage c = commitments[poolId][buyer];
        return (c.units, c.deposited, c.refunded);
    }

    function getBuyerCount(uint256 poolId) external view returns (uint256) {
        return poolBuyers[poolId].length;
    }

    function getBuyer(uint256 poolId, uint256 index) external view returns (address) {
        return poolBuyers[poolId][index];
    }

    // ── Internal ────────────────────────────────────────────────────────

    /// @dev Transition Open → Expired when deadline has passed.
    function _refreshStatus(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        if (pool.status == PoolStatus.Open && block.timestamp > pool.deadline) {
            pool.status = PoolStatus.Expired;
            emit PoolExpired(poolId);
        }
    }
}
