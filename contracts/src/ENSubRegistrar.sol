// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IL2Registry.sol";

/**
 * @title ENSubRegistrar
 * @notice Custom L2 registrar for ENSub with:
 *   - 1-per-wallet enforcement (owner can toggle)
 *   - Configurable mint price (0 = free)
 *   - Treasury address for fee collection
 *   - Owner-only admin (pause, price, treasury, limit toggle)
 */
contract ENSubRegistrar {
    IL2Registry public immutable registry;
    uint64 public immutable chainId;
    bytes32 public immutable rootNode;

    address public owner;
    address public treasury;
    uint256 public price;        // wei; 0 = free
    bool    public limitToOne;   // if true, wallet can only mint once
    bool    public paused;

    event Registered(string label, address indexed minter, bytes32 indexed node);
    event PriceSet(uint256 price);
    event TreasurySet(address treasury);
    event LimitToOneSet(bool enabled);
    event Paused(bool paused);
    event OwnershipTransferred(address indexed previous, address indexed next);

    error NotOwner();
    error Paused_();
    error InsufficientPayment(uint256 sent, uint256 required);
    error AlreadyOwnsSubdomain();
    error LabelUnavailable(string label);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _registry,
        address _treasury,
        uint256 _price,
        bool    _limitToOne
    ) {
        registry    = IL2Registry(_registry);
        chainId     = uint64(block.chainid);
        rootNode    = IL2Registry(_registry).parentNode();
        owner       = msg.sender;
        treasury    = _treasury == address(0) ? msg.sender : _treasury;
        price       = _price;
        limitToOne  = _limitToOne;
    }

    // ── Public registration ──────────────────────────────────────────────────

    function register(string calldata label, address recipient) external payable {
        if (paused) revert Paused_();

        // Payment check
        if (msg.value < price) revert InsufficientPayment(msg.value, price);

        // 1-per-wallet check
        if (limitToOne && registry.balanceOf(recipient) > 0) revert AlreadyOwnsSubdomain();

        // Availability check
        if (!registry.available(rootNode, label)) revert LabelUnavailable(label);

        // Collect fee
        if (msg.value > 0) {
            (bool ok,) = treasury.call{value: msg.value}("");
            require(ok, "Treasury transfer failed");
        }

        registry.register(rootNode, label, recipient);
        emit Registered(label, recipient, rootNode);
    }

    // ── Canary: check whether an address can mint ────────────────────────────

    function canRegister(address wallet) external view returns (bool) {
        if (paused) return false;
        if (limitToOne && registry.balanceOf(wallet) > 0) return false;
        return true;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setPrice(uint256 _price) external onlyOwner {
        price = _price;
        emit PriceSet(_price);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setLimitToOne(bool _enabled) external onlyOwner {
        limitToOne = _enabled;
        emit LimitToOneSet(_enabled);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
