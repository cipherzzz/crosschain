// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../token/simple/IRWA.sol";

contract DestinationBridge is Pausable, Ownable, AxelarExecutable {
    // Todo: add events
    // Todo: add comments

    IAxelarGasService public immutable gasService;
    bytes32 public constant CHAIN_VERSION = "0.1";
    uint256 public immutable CHAIN_ID;

    mapping(IRWA => bool) public supportedAssets;

    constructor(
        address _gw,
        address _gasReceiver,
        address _owner
    ) AxelarExecutable(_gw) Ownable(_owner) {
        CHAIN_ID = block.chainid;
        gasService = IAxelarGasService(_gasReceiver);
    }

    function bridgeAsset(
        string calldata _destinationChain,
        string calldata _destinationBridgeAddress,
        address _assetToBurn,
        address _assetToMint,
        uint256 _amount
    ) external payable {
        require(msg.value > 0, "Gas payment is required");

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

    function addSupportedAsset(address _asset) external onlyOwner {
        IRWA asset = IRWA(_asset);
        supportedAssets[asset] = true;
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
