// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RWA is Ownable, ERC20Burnable {
    address public axelarBridge;

    modifier onlyAxelarBridge() {
        require(
            msg.sender == axelarBridge,
            "RWA - Only the Axelar Bridge can call this function."
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) Ownable(_owner) ERC20(_name, _symbol) {}

    function mint(uint256 _amount) external onlyOwner {
        _mint(owner(), _amount);
    }

    function mintTo(
        address _receiver,
        uint256 _amount
    ) public onlyAxelarBridge {
        _mint(_receiver, _amount);
    }

    function setAxelarBridge(address _bridge) external onlyOwner {
        axelarBridge = _bridge;
    }
}
