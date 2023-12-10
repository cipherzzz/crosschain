// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../token/IRWA.sol";

contract RWABridge is Pausable, Ownable, AxelarExecutable {
    // Todo: add events
    // Todo: add comments

    IAxelarGasService public immutable gasService;
    uint256 public immutable CHAIN_ID;
    bytes32 public immutable CHAIN_VERSION;

    mapping(IRWA => uint256) public dailyLimitAmount;
    mapping(IRWA => uint256) private dailyTotals;
    mapping(IRWA => uint256) private dailyReset;

    mapping(IRWA => uint256) private maxTransferAmount;

    mapping(IRWA => bool) public supportedAssets;

    constructor(
        address _gw,
        address _gasReceiver,
        address _owner
    ) AxelarExecutable(_gw) Ownable(_owner) {
        CHAIN_ID = block.chainid;
        CHAIN_VERSION = "0.1.0";
        gasService = IAxelarGasService(_gasReceiver);
    }

    function bridgeAsset(
        string calldata _destinationChain,
        string calldata _destinationBridgeAddress,
        address _assetToBurn,
        address _assetToMint,
        uint256 _amount
    ) external payable onlyOwner {
        require(supportedAssets[IRWA(_assetToBurn)], "Asset is not supported");

        require(msg.value > 0, "Gas payment is required");

        require(msg.sender == owner(), "Only the owner can call this function");

        require(paused() == false, "Bridge is currently paused");

        require(
            maxTransferAmount[IRWA(_assetToBurn)] > 0,
            "No max transfer amount is configured for this asset"
        );

        require(
            _amount <= maxTransferAmount[IRWA(_assetToBurn)],
            "Amount exceeds max transfer amount"
        );

        bytes memory payload = abi.encode(
            _assetToMint,
            CHAIN_VERSION,
            CHAIN_ID,
            msg.sender,
            _amount,
            0 //nonce
        );
        gasService.payNativeGasForContractCall{value: msg.value}(
            address(this),
            _destinationChain,
            _destinationBridgeAddress,
            payload,
            msg.sender
        );

        IRWA asset = IRWA(_assetToBurn);
        if (block.timestamp > dailyReset[asset] + 1 days) {
            dailyTotals[asset] = 0;
            dailyReset[asset] = block.timestamp;
        }
        require(
            dailyTotals[asset] + _amount <= dailyLimitAmount[asset],
            "Requested amount would exceed daily limit for tokn/chain"
        );

        dailyTotals[asset] += _amount;

        asset.burnFrom(msg.sender, _amount);

        gateway.callContract(
            _destinationChain,
            _destinationBridgeAddress,
            payload
        );
    }

    function _execute(
        string calldata _originChain,
        string calldata _originAddress,
        bytes calldata _data
    ) internal override whenNotPaused {
        (
            address _asset,
            bytes32 _version,
            ,
            address _originSender,
            uint256 _amount,
            uint256 _nonce
        ) = abi.decode(
                _data,
                (address, bytes32, uint256, address, uint256, uint256)
            );

        IRWA asset = IRWA(_asset);
        asset.mintTo(_originSender, _amount);
    }

    function addSupportedAsset(
        address _asset,
        uint256 maxTransfer,
        uint256 dailyLimit
    ) external onlyOwner {
        IRWA asset = IRWA(_asset);
        supportedAssets[asset] = true;
        maxTransferAmount[asset] = maxTransfer;
        dailyLimitAmount[asset] = dailyLimit;
    }

    function removeSupportedAsset(
        address _asset,
        uint256 dailyLimit,
        uint256 maxTransfer
    ) external onlyOwner {
        IRWA asset = IRWA(_asset);
        delete supportedAssets[asset];
        delete dailyLimitAmount[asset];
        delete maxTransferAmount[asset];
    }

    // Todo: removeAsset?

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}

    // Todo get orphaned assets mistakenly sent to this contract back to the sender
}
