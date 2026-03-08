// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PurchasePool — collaborative group-purchasing escrow with on-chain tiered pricing
/// @notice Businesses pool ERC-20 commitments toward a supplier MOQ.
///         Each pool stores an array of price tiers. The active tier is determined
///         by the pool's current totalUnits. Pools remain open until their deadline
///         so buyers can keep committing toward higher (cheaper) tiers.
///         At the deadline the pool resolves to Fulfilled (threshold met) or
///         Expired (threshold not met). A platform fee is deducted on withdrawal.
contract PurchasePool is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_FEE_BPS = 1000; // 10 % hard cap
    uint256 public constant MAX_TIERS = 10;

    enum PoolStatus { Open, Fulfilled, Expired, Withdrawn }

    struct PriceTier {
        uint256 minUnits;
        uint256 pricePerUnit;
        bool    mandatory;
    }

    struct Pool {
        string     productName;
        uint256    deadline;
        IERC20     token;
        uint256    totalUnits;
        uint256    totalDeposited;
        PoolStatus status;
        uint256    tierCount;
        uint256    fulfillmentThreshold; // minUnits of the first mandatory tier
    }

    struct Commitment {
        uint256 units;
        uint256 deposited;
        bool    refunded;
    }

    uint256 public nextPoolId;
    uint256 public feeBps;
    address public feeRecipient;
    uint256 public totalFeesCollected;

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => PriceTier[]) private _poolTiers;
    mapping(uint256 => mapping(address => Commitment)) public commitments;
    mapping(uint256 => address[]) public poolBuyers;
    mapping(uint256 => mapping(address => bool)) private _isBuyer;

    // ── Events ──────────────────────────────────────────────────────────
    event PoolCreated(
        uint256 indexed poolId,
        string  productName,
        uint256 basePricePerUnit,
        uint256 fulfillmentThreshold,
        uint256 deadline,
        address token,
        uint256 tierCount
    );
    event Committed(
        uint256 indexed poolId,
        address indexed buyer,
        uint256 units,
        uint256 amount,
        uint256 tierPricePerUnit
    );
    event PoolFulfilled(uint256 indexed poolId, uint256 totalUnits);
    event PoolExpired(uint256 indexed poolId);
    event Refunded(uint256 indexed poolId, address indexed buyer, uint256 amount);
    event FundsWithdrawn(uint256 indexed poolId, uint256 amount, uint256 fee);
    event FeeUpdated(uint256 oldBps, uint256 newBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    constructor(uint256 _feeBps, address _feeRecipient) Ownable(msg.sender) {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds max");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
    }

    // ── Admin ───────────────────────────────────────────────────────────

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds max");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    /// @notice Extend (or change) the deadline for an open pool.
    function setDeadline(uint256 poolId, uint256 newDeadline) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.Open || pool.status == PoolStatus.Fulfilled, "Pool not active");
        require(newDeadline > block.timestamp, "Deadline must be in the future");
        pool.deadline = newDeadline;
        if (pool.status == PoolStatus.Fulfilled) {
            pool.status = PoolStatus.Open;
        }
    }

    /// @notice Create a pool with on-chain price tiers.
    /// @param tierMinUnits  Sorted ascending array of unit thresholds (first must be 1).
    /// @param tierPrices    Corresponding price-per-unit in token smallest units.
    /// @param tierMandatory Whether reaching this tier locks in fulfillment.
    function createPool(
        string   calldata productName,
        uint256[] calldata tierMinUnits,
        uint256[] calldata tierPrices,
        bool[]   calldata tierMandatory,
        uint256  deadline,
        address  token
    ) external onlyOwner returns (uint256 poolId) {
        uint256 n = tierMinUnits.length;
        require(n > 0 && n <= MAX_TIERS, "Invalid tier count");
        require(n == tierPrices.length && n == tierMandatory.length, "Tier array mismatch");
        require(tierMinUnits[0] == 1, "First tier must start at 1");
        require(tierPrices[0] > 0, "Price must be > 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(token != address(0), "Invalid token");

        uint256 fulfillment = 0;
        for (uint256 i = 0; i < n; i++) {
            if (i > 0) {
                require(tierMinUnits[i] > tierMinUnits[i - 1], "Tiers must be sorted ascending");
            }
            require(tierPrices[i] > 0, "Price must be > 0");
            if (tierMandatory[i] && fulfillment == 0) {
                fulfillment = tierMinUnits[i];
            }
        }
        require(fulfillment > 0, "At least one mandatory tier required");

        poolId = nextPoolId++;
        pools[poolId] = Pool({
            productName:          productName,
            deadline:             deadline,
            token:                IERC20(token),
            totalUnits:           0,
            totalDeposited:       0,
            status:               PoolStatus.Open,
            tierCount:            n,
            fulfillmentThreshold: fulfillment
        });

        for (uint256 i = 0; i < n; i++) {
            _poolTiers[poolId].push(PriceTier({
                minUnits:    tierMinUnits[i],
                pricePerUnit: tierPrices[i],
                mandatory:   tierMandatory[i]
            }));
        }

        emit PoolCreated(
            poolId, productName, tierPrices[0], fulfillment, deadline, token, n
        );
    }

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

    /// @notice Commit `units` to a pool. Cost is calculated from the active
    ///         tier based on the pool's total units after this commit.
    function commit(uint256 poolId, uint256 units) external {
        require(units > 0, "Units must be > 0");

        Pool storage pool = pools[poolId];
        _refreshStatus(poolId);
        require(pool.status == PoolStatus.Open, "Pool not open");

        uint256 newTotal = pool.totalUnits + units;
        uint256 tierPrice = _getActiveTierPrice(poolId, newTotal);
        uint256 cost = units * tierPrice;

        pool.token.safeTransferFrom(msg.sender, address(this), cost);

        Commitment storage c = commitments[poolId][msg.sender];
        c.units     += units;
        c.deposited += cost;

        pool.totalUnits     = newTotal;
        pool.totalDeposited += cost;

        if (!_isBuyer[poolId][msg.sender]) {
            poolBuyers[poolId].push(msg.sender);
            _isBuyer[poolId][msg.sender] = true;
        }

        emit Committed(poolId, msg.sender, units, cost, tierPrice);
    }

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

    /// @notice Backward-compatible pool view. Returns basePricePerUnit (tier 0)
    ///         and fulfillmentThreshold where moq used to be.
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
            s = p.totalUnits >= p.fulfillmentThreshold
                ? PoolStatus.Fulfilled
                : PoolStatus.Expired;
        }
        uint256 basePrice = p.tierCount > 0 ? _poolTiers[poolId][0].pricePerUnit : 0;
        return (
            p.productName,
            basePrice,
            p.fulfillmentThreshold,
            p.deadline,
            address(p.token),
            p.totalUnits,
            p.totalDeposited,
            s
        );
    }

    /// @notice Returns the full tier array for a pool.
    function getPoolTiers(uint256 poolId) external view returns (
        uint256[] memory minUnits,
        uint256[] memory prices,
        bool[]    memory mandatory
    ) {
        uint256 n = _poolTiers[poolId].length;
        minUnits  = new uint256[](n);
        prices    = new uint256[](n);
        mandatory = new bool[](n);
        for (uint256 i = 0; i < n; i++) {
            PriceTier storage t = _poolTiers[poolId][i];
            minUnits[i]  = t.minUnits;
            prices[i]    = t.pricePerUnit;
            mandatory[i] = t.mandatory;
        }
    }

    /// @notice Returns the price-per-unit for the active tier at `totalUnits`.
    function getActiveTierPrice(uint256 poolId, uint256 totalUnits) external view returns (uint256) {
        return _getActiveTierPrice(poolId, totalUnits);
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

    function _getActiveTierPrice(uint256 poolId, uint256 totalUnits) internal view returns (uint256) {
        PriceTier[] storage tiers = _poolTiers[poolId];
        uint256 n = tiers.length;
        require(n > 0, "No tiers");
        for (uint256 i = n; i > 0; i--) {
            if (totalUnits >= tiers[i - 1].minUnits) {
                return tiers[i - 1].pricePerUnit;
            }
        }
        return tiers[0].pricePerUnit;
    }

    function _refreshStatus(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        if (pool.status == PoolStatus.Open && block.timestamp > pool.deadline) {
            if (pool.totalUnits >= pool.fulfillmentThreshold) {
                pool.status = PoolStatus.Fulfilled;
                emit PoolFulfilled(poolId, pool.totalUnits);
            } else {
                pool.status = PoolStatus.Expired;
                emit PoolExpired(poolId);
            }
        }
    }
}
