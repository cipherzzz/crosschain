// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {AddressToString} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "../token/simple/IRWA.sol";

contract OriginBridge is Pausable, Ownable {
    bytes32 public constant CHAIN_VERSION = "0.1";
    uint256 public immutable CHAIN_ID;

    IAxelarGasService public immutable gasSvc;
    IAxelarGateway public immutable gw;

    uint256 public nonce;

    mapping(string => string) public destinationChainToDestinationBridge;
    mapping(IRWA => bool) public supportedAssets;
    mapping(IRWA => uint256) public maxTransferAmounts;
    mapping(IRWA => uint256) public dailyLimits;

    constructor(address _gw, address _gasSvc, address _owner) Ownable(_owner) {
        CHAIN_ID = block.chainid;
        gasSvc = IAxelarGasService(_gasSvc);
        gw = IAxelarGateway(_gw);
    }

    function addDestinationChain(
        string calldata _destinationChain,
        address _destinationBridgeAddress
    ) external onlyOwner {
        destinationChainToDestinationBridge[_destinationChain] = AddressToString
            .toString(_destinationBridgeAddress);
    }

    // Todo: removeDestinationChain?

    function addSupportedAsset(
        address _asset,
        uint256 _maxTransferAmount,
        uint256 _dailyLimit
    ) external onlyOwner {
        IRWA asset = IRWA(_asset);

        require(
            supportedAssets[asset] == false,
            "OriginBridge => addSupportedAsset: Asset already exists"
        );

        supportedAssets[asset] = true;
        dailyLimits[asset] = _dailyLimit;
        maxTransferAmounts[asset] = _maxTransferAmount;
    }

    //Todo: removeSupportedAsset?
    //Todo: update the max transfer size for a supported token?
    //Todo: update the daily limit for a supported token?

    function bridgeAsset(
        address _asset,
        uint256 _amount,
        string calldata _destinationChain
    ) external payable whenNotPaused {
        IRWA asset = IRWA(_asset);

        string
            memory destinationBridgeAddress = destinationChainToDestinationBridge[
                _destinationChain
            ];

        require(
            supportedAssets[asset] == true,
            "AxelarSourceBridge::initiateBridge: Token is not supported by the bridge."
        );
        require(
            msg.value > 0,
            "AxelarSourceBridge::initiateBridge: Cannot send zero gas."
        );
        require(
            _amount > 0,
            "AxelarSourceBridge::initiateBridge: Cannot transfer zero tokens."
        );
        require(
            _amount <= maxTransferAmounts[asset],
            "AxelarSourceBridge::initiateBridge: Amount to be transferred is greater than the maximum transfer size."
        );

        asset.burnFrom(msg.sender, _amount);

        uint256 newNonce = nonce++;
        bytes memory data = abi.encode(
            asset,
            CHAIN_VERSION,
            CHAIN_ID,
            msg.sender,
            _amount,
            newNonce
        );

        _payGasAndCallContract(
            _destinationChain,
            destinationBridgeAddress,
            data
        );
    }

    function _payGasAndCallContract(
        string calldata _destinationChain,
        string memory _destinationBridgeAddress,
        bytes memory _data
    ) private {
        gasSvc.payNativeGasForContractCall{value: msg.value}(
            address(this),
            _destinationChain,
            _destinationBridgeAddress,
            _data,
            msg.sender
        );

        gw.callContract(_destinationChain, _destinationBridgeAddress, _data);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
