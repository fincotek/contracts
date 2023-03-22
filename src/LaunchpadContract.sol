// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './IERC20.sol';

contract LaunchpadContract {
    enum Status {
        Progress,
        Cancel,
        Fail,
        Success
    }

    Status _status = Status.Progress;
    address public creator;
    address public owner;
    uint256 public total;

    address public token;
    uint256 public tokenSupply;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public minBuy;
    uint256 public maxBuy;
    uint256 public startDate;
    uint256 public endDate;
    bool public burn;

    address[] public contributors;
    mapping(address => uint256) public balanceOf;

    event Buy(address indexed from, uint256 value);
    event Cancel(address indexed from);
    event Fail(address indexed from);
    event Success(address indexed from, uint256 value);
    event Burn(address indexed from, uint256 value);

    modifier authorized() {
        require(
            owner == msg.sender || creator == msg.sender,
            'Sender not authorized'
        );
        _;
    }

    constructor(
        address _owner,
        address _creator,
        address _token,
        uint256 _tokenSupply,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _minBuy,
        uint256 _maxBuy,
        uint256 _startDate,
        uint256 _endDate,
        bool _burn
    ) {
        owner = _owner;
        creator = _creator;
        token = _token;
        tokenSupply = _tokenSupply;
        softCap = _softCap;
        hardCap = _hardCap;
        minBuy = _minBuy;
        maxBuy = _maxBuy;
        startDate = _startDate;
        endDate = _endDate;
        burn = _burn;
    }

    function tokenOf(address _address) public view returns (uint256) {
        return (balanceOf[_address] * rate()) / 10 ** 18;
    }

    function rate() public view returns (uint256) {
        return _rate(tokenSupply, hardCap);
    }

    function status() public view returns (string memory) {
        if (_status == Status.Success) {
            return 'Success';
        } else if (_status == Status.Cancel) {
            return 'Cancel';
        } else if (_status == Status.Fail) {
            return 'Fail';
        }
        return block.timestamp < startDate ? 'Coming' : 'Progress';
    }

    function buy() external payable {
        uint256 value = balanceOf[msg.sender] + msg.value;
        require(_status == Status.Progress, 'status != progress');
        require(value >= minBuy, 'value < min buy');
        require(value <= maxBuy, 'value > max buy');
        require(block.timestamp >= startDate, 'timestamp < start date');
        require(block.timestamp <= endDate, 'timestamp > end date');
        require((total + value) <= hardCap, 'balance + value > hard cap');
        total += msg.value;
        if (balanceOf[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        balanceOf[msg.sender] += msg.value;
        emit Buy(msg.sender, msg.value);
    }

    function cancel() external authorized {
        _refund();
        _status = Status.Cancel;
        emit Cancel(token);
    }

    function finalize() external authorized {
        IERC20 erc20 = IERC20(token);
        address contractAddress = address(this);

        if (total <= softCap) {
            _refund();
            _status = Status.Fail;
            emit Fail(token);
        } else {
            for (uint256 i = 0; i < contributors.length; i++) {
                erc20.transfer(contributors[i], tokenOf(contributors[i]));
            }
            _status = Status.Success;
            emit Success(token, contractAddress.balance);
            payable(creator).transfer(
                _rate(contractAddress.balance, 20) / 10 ** 18
            );
            payable(owner).transfer(contractAddress.balance);
        }

        uint256 tokenBalance = erc20.balanceOf(contractAddress);
        if (tokenBalance > 0) {
            if (burn) {
                erc20.burn(tokenBalance);
                emit Burn(token, tokenBalance);
            } else {
                erc20.transfer(owner, erc20.balanceOf(contractAddress));
            }
        }
    }

    function _refund() private {
        IERC20 erc20 = IERC20(token);
        for (uint256 i = 0; i < contributors.length; i++) {
            payable(contributors[i]).transfer(balanceOf[contributors[i]]);
        }
        erc20.transfer(owner, tokenSupply);
    }

    function _rate(uint256 value1, uint256 value2) private pure returns (uint) {
        return (value1 * 10 ** 18) / value2;
    }
}
