// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../token/simple/IRWA.sol";

contract DestinationBridge is Pausable, Ownable, AxelarExecutable {
    // Todo: add events
    // Todo: add comments

    IAxelarGateway public immutable gw;

    bytes32 public constant VERSION = "0.1";
    uint256 public immutable CHAIN_ID;

    mapping(IRWA => bool) public supportedAssets;
    mapping(string => string) public originChainToOriginBridge;
    mapping(string => mapping(uint256 => bool)) public isUsedNonce;

    constructor(
        address _gw,
        address _owner
    ) AxelarExecutable(_gw) Ownable(_owner) {
        CHAIN_ID = block.chainid;
        gw = IAxelarGateway(_gw);
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
        string memory originBridge = originChainToOriginBridge[_originChain];

        isUsedNonce[originBridge][_nonce] = true;

        asset.mintTo(_originSender, _amount);
    }

    function addOriginBridge(
        string calldata _originChain,
        string calldata _originBridgeAddress
    ) external onlyOwner {
        originChainToOriginBridge[_originChain] = _originBridgeAddress;
    }

    // Todo: removeOriginBridge?

    function addAsset(address _asset) external onlyOwner {
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

    // Todo get orphaned assets mistakenly sent to this contract back to the sender
}
