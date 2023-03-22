// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './ERC20.sol';

contract ERC20Create {
    address public owner;
    uint256 public fee;
    mapping(address => address) public contractOf;

    constructor(uint256 _fee) {
        owner = msg.sender;
        fee = _fee;
    }

    function deploy(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint totalSupply
    ) external payable {
        require(msg.value >= fee, 'Fee');
        ERC20 erc20 = new ERC20(
            msg.sender,
            name,
            symbol,
            decimals,
            totalSupply
        );
        contractOf[msg.sender] = address(erc20);
        payable(owner).transfer(msg.value);
    }
}
