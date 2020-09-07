pragma solidity ^0.5.0;

import "./KIP17Full.sol";

contract KIP17Token is KIP17Full {
    constructor (string memory name, uint256 expireDay, uint256 stampCount) public KIP17Full(name, "KS", expireDay, stampCount) {
    }
}