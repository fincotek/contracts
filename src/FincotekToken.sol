// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract FincotekToken is ERC20, ERC20Burnable, Ownable, ERC20Permit {
    uint256 public constant SUPPLY_CAP = 1000000000 ether;
    constructor() ERC20("Fincotek Token", "FIK") ERC20Permit("Fincotek Token") {
        mint(msg.sender, SUPPLY_CAP);
    }

    function mint(address to, uint256 amount) public onlyOwner returns(bool) {
        if (totalSupply() + amount <= SUPPLY_CAP) {
            _mint(to, amount);
            return true;
        }
        return false;
    }
}