// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './IERC20.sol';
import './LaunchpadContract.sol';

contract Launchpad {
    address public owner;
    uint256 public fee;
    mapping(address => address) public contractOf;

    constructor(uint256 _fee) {
        owner = msg.sender;
        fee = _fee;
    }

    function deploy(
        address token,
        uint256 tokenSupply,
        uint256 softCap,
        uint256 hardCap,
        uint256 minBuy,
        uint256 maxBuy,
        uint256 startDate,
        uint256 endDate,
        bool burn
    ) public payable {
        require(msg.value >= fee, 'Fee');
        LaunchpadContract launchpadContract = new LaunchpadContract(
            msg.sender,
            owner,
            token,
            tokenSupply,
            softCap,
            hardCap,
            minBuy,
            maxBuy,
            startDate,
            endDate,
            burn
        );
        contractOf[token] = address(launchpadContract);
        IERC20 erc20 = IERC20(token);
        erc20.transferFrom(msg.sender, contractOf[token], tokenSupply);
        payable(owner).transfer(msg.value);
    }
}
