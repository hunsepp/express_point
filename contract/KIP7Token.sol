pragma solidity ^0.5.0;

import "./KIP7Metadata.sol";
import "./KIP7.sol";

contract KIP7Token is KIP7Metadata, KIP7 {
    constructor(string memory name) KIP7Metadata(name, "KUN", 0) public {}
}