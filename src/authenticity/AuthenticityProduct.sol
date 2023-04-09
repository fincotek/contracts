// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import './AuthenticityCompany.sol';

contract AuthenticityProduct {
    event Transfer(address indexed from, address indexed to, uint256 tokenId);
    event Destroy(address indexed from, uint256 tokenId);

    address public company;
    string public ref;
    string public name;
    string public description;
    string public image;
    string public link;
    uint256 public supply;
    uint256 public tokenId;
    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public identifierOf;
    mapping(string => uint256) public tokenOf;

    modifier onlyCompany() {
        _onlyCompany();
        _;
    }

    function _onlyCompany() private view {
        require(AuthenticityCompany(company).owner() == msg.sender);
    }

    constructor(
        address _company,
        string memory _ref,
        string memory _name,
        string memory _description,
        string memory _image,
        string memory _link
    ) {
        company = _company;
        _onlyCompany();
        ref = _ref;
        name = _name;
        description = _description;
        image = _image;
        link = _link;
    }

    function changeDescription(
        string memory _description
    ) external onlyCompany {
        description = _description;
    }

    function changeImage(string memory _image) external onlyCompany {
        image = _image;
    }

    function changeLink(string memory _link) external onlyCompany {
        link = _link;
    }

    function create(string[] memory identifiers) external onlyCompany {
        supply += identifiers.length;
        for (uint256 i = 0; i < identifiers.length; i++) {
            require(tokenOf[identifiers[i]] == 0);
            tokenId++;
            ownerOf[tokenId] = msg.sender;
            identifierOf[tokenId] = identifiers[i];
            tokenOf[identifiers[i]] = tokenId;
            emit Transfer(address(0), msg.sender, tokenId);
        }
    }

    function destroy(uint256 _tokenId) external returns (bool) {
        require(ownerOf[_tokenId] == msg.sender);
        delete ownerOf[_tokenId];
        emit Destroy(msg.sender, tokenId);
        return true;
    }

    function transfer(address to, uint256 _tokenId) external returns (bool) {
        require(to != address(0));
        require(ownerOf[_tokenId] == msg.sender);
        ownerOf[_tokenId] = to;
        emit Transfer(msg.sender, to, tokenId);
        return true;
    }

    function ownerOfIdentifier(
        string memory identifier
    ) external view returns (address) {
        return ownerOf[tokenOf[identifier]];
    }
}
