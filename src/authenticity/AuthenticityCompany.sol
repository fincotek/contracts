// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './AuthenticityProduct.sol';

contract AuthenticityCompany is Ownable {
    string public name;
    string public identifier;
    string public country;

    constructor(string memory _name, string memory _identifier, string memory _country) {
        name = _name;
        identifier = _identifier;
        country = _country;
    }
}
