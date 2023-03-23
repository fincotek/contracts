// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './IERC20.sol';
import './SafeMath.sol';

contract ERC20 is IERC20 {
    using SafeMath for uint256;

    address public owner;
    uint public totalSupply;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;
    string public name;
    string public symbol;
    uint8 public decimals;

    modifier onlyOwner() {
        require(owner == msg.sender, 'Caller is not owner');
        _;
    }

    constructor() {
        owner = msg.sender;
        name = "Test";
        symbol = "TEST";
        decimals = 18;
        totalSupply = 10000000 * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public returns (bool) {
        _approve(
            msg.sender,
            spender,
            allowance[msg.sender][spender].add(addedValue)
        );
        return true;
    }

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public returns (bool) {
        _approve(
            msg.sender,
            spender,
            allowance[msg.sender][spender].sub(
                subtractedValue,
                'Decreased allowance below zero'
            )
        );
        return true;
    }

    function mint(uint amount) external onlyOwner {
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function burn(uint amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function _approve(
        address sender,
        address spender,
        uint256 amount
    ) internal {
        require(sender != address(0), 'Approve from the zero address');
        require(spender != address(0), 'Approve to the zero address');

        allowance[sender][spender] = amount;
        emit Approval(sender, spender, amount);
    }
}
