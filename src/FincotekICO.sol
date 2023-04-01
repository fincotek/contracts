// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './IERC20.sol';

contract FincotekICO {

    address public owner;
    address public token;
    uint256 public tokenSupply = 50000000 ether;
    uint256 public minBuy = 0.01 ether;
    uint256 public maxBuy = 1 ether;
    uint256 public hardCap = 20 ether;
    uint256 public balance;
    mapping(address => uint256) public balanceOf;

    event SendToken(address indexed from, uint256 value);
    event Buy(address indexed from, uint256 value);

    modifier onlyOwner() {
        require(owner == msg.sender, 'Caller is not owner');
        _;
    }

    constructor(address _token) {
        owner = msg.sender;
        token = _token;
    }

    function tokenOf(address _address) public view returns (uint256) {
        return _tokenValue(balanceOf[_address]);
    }

    function rate() public view returns (uint256) {
        return _rate(tokenSupply, hardCap);
    }

    function sendToken() external onlyOwner {
        IERC20 erc20 = IERC20(token);
        require(erc20.balanceOf(address(this)) == 0, 'Token sent');
        erc20.transferFrom(msg.sender, address(this), tokenSupply);
        emit SendToken(msg.sender, tokenSupply);
    }

    receive() external payable {
        uint256 value = balanceOf[msg.sender] + msg.value;
        require(value >= minBuy, 'Value is less than min buy');
        require(value <= maxBuy, 'Value is greater than max buy');
        require(address(this).balance <= hardCap, 'Balance is greater than hard cap');
        balance += msg.value;
        balanceOf[msg.sender] += msg.value;
        IERC20 erc20 = IERC20(token);
        erc20.transfer(address(msg.sender), _tokenValue(msg.value));
        emit Buy(msg.sender, msg.value);
    }

    function withdraw() external {
        payable(owner).transfer(address(this).balance);
    }

    function refund() external onlyOwner {
        IERC20 erc20 = IERC20(token);
        erc20.transfer(owner, erc20.balanceOf(address(this)));
    }

    function _tokenValue(uint256 value) private view returns (uint256) {
        return (value * rate()) / 10 ** 18;
    }

    function _rate(uint256 value1, uint256 value2) private pure returns (uint256) {
        return (value1 * 10 ** 18) / value2;
    }
}