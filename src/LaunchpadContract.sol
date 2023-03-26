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

    uint256 public _sent;
    address[] private _contributors;
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

    function contributors() public view returns (uint256) {
        return _contributors.length;
    }

    function isSent() public view returns (bool) {
        return _sent == contributors();
    }

    function status() public view returns (string memory) {
        if (_status == Status.Success) {
            return 'Success';
        } else if (_status == Status.Cancel) {
            return 'Cancel';
        } else if (_status == Status.Fail) {
            return 'Fail';
        }
        return 'Progress';
    }

    function buy() external payable {
        uint256 value = balanceOf[msg.sender] + msg.value;
        require(_status == Status.Progress, 'Launchpad is close');
        require(value >= minBuy, 'Value is less than min buy');
        require(value <= maxBuy, 'Value is greater than max buy');
        require(block.timestamp >= startDate, 'Timestamp is less than start date');
        require(block.timestamp <= endDate, 'Timestamp is greater than end date');
        require(address(this).balance <= hardCap, 'Balance is greater than hard cap');
        total += msg.value;
        if (balanceOf[msg.sender] == 0) {
            _contributors.push(msg.sender);
        }
        balanceOf[msg.sender] += msg.value;
        emit Buy(msg.sender, msg.value);
    }

    function cancel() external authorized {
        _status = Status.Cancel;
        emit Cancel(token);
    }

    function finalize() external authorized {
        require(_status == Status.Progress);
        if (address(this).balance < softCap) {
            _status = Status.Fail;
            emit Fail(token);
        } else {
            _status = Status.Success;
            emit Success(token, address(this).balance);
        }
    }

    function send() external {
        require(_status != Status.Progress, 'Launchpad in progress');
        require(!isSent(), 'Tokens sent');
        IERC20 erc20 = IERC20(token);
        uint256 max = _contributors.length;
        uint256 MAX = 256;
        if (max > MAX && max - MAX > _sent) {
            max = _sent + MAX;
        }
        for (uint256 i = _sent; i < max; i++) {
            if (_isFail()) {
                payable(_contributors[i]).transfer(balanceOf[_contributors[i]]);
            } else {
                erc20.transfer(_contributors[i], tokenOf(_contributors[i]));
            }
            _sent = i + 1;
        }
    }

    function withdraw() external {
        require(_status != Status.Progress, 'Launchpad in progress');
        require(isSent(), 'Tokens not sent');
        IERC20 erc20 = IERC20(token);
        address contractAddress = address(this);
        require(contractAddress.balance > 0 || erc20.balanceOf(contractAddress) > 0, 'Balance is null');
        if (_isFail()) {
            erc20.transfer(owner, tokenSupply);
        } else {
            payable(creator).transfer(_rate(contractAddress.balance, 20) / 10 ** 18);
            payable(owner).transfer(contractAddress.balance);
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
    }

    function _isFail() private view returns (bool) {
        return _status == Status.Cancel || _status == Status.Fail;
    }

    function _rate(uint256 value1, uint256 value2) private pure returns (uint256) {
        return (value1 * 10 ** 18) / value2;
    }
}