// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IL2Registry {
    function createSubnode(bytes32 node, string calldata label, address _owner, bytes[] calldata data) external;
    function baseNode() external view returns (bytes32);
    function balanceOf(address owner) external view returns (uint256);
}
