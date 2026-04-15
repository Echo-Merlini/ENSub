// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IL2Registry {
    function register(bytes32 parentNode, string calldata label, address owner) external;
    function available(bytes32 parentNode, string calldata label) external view returns (bool);
    function parentNode() external view returns (bytes32);
    function balanceOf(address owner) external view returns (uint256);
}
