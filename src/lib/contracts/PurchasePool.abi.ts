export const purchasePoolAbi = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_feeBps", "type": "uint256", "internalType": "uint256" },
      { "name": "_feeRecipient", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "MAX_FEE_BPS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_TIERS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimRefund",
    "inputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "commit",
    "inputs": [
      { "name": "poolId", "type": "uint256", "internalType": "uint256" },
      { "name": "units", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "commitments",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "units", "type": "uint256", "internalType": "uint256" },
      { "name": "deposited", "type": "uint256", "internalType": "uint256" },
      { "name": "refunded", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createPool",
    "inputs": [
      { "name": "productName", "type": "string", "internalType": "string" },
      { "name": "tierMinUnits", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "tierPrices", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "tierMandatory", "type": "bool[]", "internalType": "bool[]" },
      { "name": "deadline", "type": "uint256", "internalType": "uint256" },
      { "name": "token", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "feeBps",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feeRecipient",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getActiveTierPrice",
    "inputs": [
      { "name": "poolId", "type": "uint256", "internalType": "uint256" },
      { "name": "totalUnits", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBuyer",
    "inputs": [
      { "name": "poolId", "type": "uint256", "internalType": "uint256" },
      { "name": "index", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBuyerCount",
    "inputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCommitment",
    "inputs": [
      { "name": "poolId", "type": "uint256", "internalType": "uint256" },
      { "name": "buyer", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "units", "type": "uint256", "internalType": "uint256" },
      { "name": "deposited", "type": "uint256", "internalType": "uint256" },
      { "name": "refunded", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPool",
    "inputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "productName", "type": "string", "internalType": "string" },
      { "name": "pricePerUnit", "type": "uint256", "internalType": "uint256" },
      { "name": "moq", "type": "uint256", "internalType": "uint256" },
      { "name": "deadline", "type": "uint256", "internalType": "uint256" },
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "totalUnits", "type": "uint256", "internalType": "uint256" },
      { "name": "totalDeposited", "type": "uint256", "internalType": "uint256" },
      { "name": "status", "type": "uint8", "internalType": "enum PurchasePool.PoolStatus" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPoolTiers",
    "inputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "minUnits", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "prices", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "mandatory", "type": "bool[]", "internalType": "bool[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextPoolId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "poolBuyers",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pools",
    "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "productName", "type": "string", "internalType": "string" },
      { "name": "deadline", "type": "uint256", "internalType": "uint256" },
      { "name": "token", "type": "address", "internalType": "contract IERC20" },
      { "name": "totalUnits", "type": "uint256", "internalType": "uint256" },
      { "name": "totalDeposited", "type": "uint256", "internalType": "uint256" },
      { "name": "status", "type": "uint8", "internalType": "enum PurchasePool.PoolStatus" },
      { "name": "tierCount", "type": "uint256", "internalType": "uint256" },
      { "name": "fulfillmentThreshold", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFeeBps",
    "inputs": [{ "name": "_feeBps", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFeeRecipient",
    "inputs": [{ "name": "_feeRecipient", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalFeesCollected",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawFunds",
    "inputs": [{ "name": "poolId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Committed",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "buyer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "units", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "tierPricePerUnit", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeeRecipientUpdated",
    "inputs": [
      { "name": "oldRecipient", "type": "address", "indexed": false, "internalType": "address" },
      { "name": "newRecipient", "type": "address", "indexed": false, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeeUpdated",
    "inputs": [
      { "name": "oldBps", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "newBps", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FundsWithdrawn",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "fee", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PoolCreated",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "productName", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "basePricePerUnit", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "fulfillmentThreshold", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "deadline", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "token", "type": "address", "indexed": false, "internalType": "address" },
      { "name": "tierCount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PoolExpired",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PoolFulfilled",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "totalUnits", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Refunded",
    "inputs": [
      { "name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "buyer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [{ "name": "token", "type": "address", "internalType": "address" }]
  }
] as const;
