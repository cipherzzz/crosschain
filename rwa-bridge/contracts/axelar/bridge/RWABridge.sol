// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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

    // for multisig
    string private constant MSG_PREFIX = "\x19Ethereum Signed Message:\n32";
    uint256 public nonce;
    uint8 public threshhold;
    mapping(address => bool) public signers;

    struct BridgeTx {
        string destinationChain;
        string destinationBridgeAddress;
        address assetToBurn;
        address assetToMint;
        uint256 amount;
    }

    constructor(
        address _gw,
        address _gasReceiver,
        address _owner,
        address[] memory _signers,
        uint8 _threshhold
    ) AxelarExecutable(_gw) Ownable(_owner) {
        require(_threshhold <= _signers.length);

        CHAIN_ID = block.chainid;
        CHAIN_VERSION = "0.1.0";
        gasService = IAxelarGasService(_gasReceiver);

        for (uint8 i = 0; i < _signers.length; i++) {
            signers[_signers[i]] = true;
        }
    }

    function bridgeAsset(
        BridgeTx calldata _bridgeTx,
        uint256 _nonce,
        bytes[] calldata _signatures
    ) external payable {
        require(
            supportedAssets[IRWA(_bridgeTx.assetToBurn)],
            "Asset is not supported"
        );

        require(msg.value > 0, "Gas payment is required");

        require(paused() == false, "Bridge is currently paused");

        require(
            maxTransferAmount[IRWA(_bridgeTx.assetToBurn)] > 0,
            "No max transfer amount is configured for this asset"
        );

        require(
            _bridgeTx.amount <= maxTransferAmount[IRWA(_bridgeTx.assetToBurn)],
            "Amount exceeds max transfer amount"
        );

        // will throw an error in sad path
        verifySignatures(_bridgeTx, _nonce, _signatures);
        nonce = _nonce;

        bytes memory payload = abi.encode(
            _bridgeTx.assetToMint,
            msg.sender,
            _bridgeTx.amount
        );
        gasService.payNativeGasForContractCall{value: msg.value}(
            address(this),
            _bridgeTx.destinationChain,
            _bridgeTx.destinationBridgeAddress,
            payload,
            msg.sender
        );

        IRWA asset = IRWA(_bridgeTx.assetToBurn);
        if (block.timestamp > dailyReset[asset] + 1 days) {
            dailyTotals[asset] = 0;
            dailyReset[asset] = block.timestamp;
        }
        require(
            dailyTotals[asset] + _bridgeTx.amount <= dailyLimitAmount[asset],
            "Requested amount would exceed daily limit for tokn/chain"
        );

        dailyTotals[asset] += _bridgeTx.amount;

        asset.burnFrom(msg.sender, _bridgeTx.amount);

        gateway.callContract(
            _bridgeTx.destinationChain,
            _bridgeTx.destinationBridgeAddress,
            payload
        );
    }

    function _execute(
        string calldata _originChain,
        string calldata _originAddress,
        bytes calldata _data
    ) internal override whenNotPaused {
        (address _asset, address _originSender, uint256 _amount) = abi.decode(
            _data,
            (address, address, uint256)
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

    function removeSupportedAsset(address _asset) external onlyOwner {
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

    function generateDigest(
        BridgeTx calldata _tx,
        uint256 _nonce
    ) private pure returns (bytes32) {
        bytes memory encoded = abi.encode(_tx);
        bytes32 _digest = keccak256(abi.encodePacked(encoded, _nonce));
        _digest = keccak256(abi.encodePacked(MSG_PREFIX, _digest));
        return _digest;
    }

    function verifySignatures(
        BridgeTx calldata _tx,
        uint256 _nonce,
        bytes[] calldata _signatures
    ) private view {
        require(
            _signatures.length >= threshhold,
            "Insufficient signatures for given threshhold"
        );
        require(_nonce > nonce, "Invalid nonce");
        bytes32 digest = generateDigest(_tx, _nonce);

        address previousSigner; // zero - the addresses were sorted in ascendin order when added
        for (uint256 i = 0; i < _signatures.length; i++) {
            bytes memory signature = _signatures[i];
            address signer = ECDSA.recover(digest, signature);
            bool isValid = signers[signer];
            require(isValid, "Signer is not valid");
            require(signer > previousSigner, "Potential duplicate signer"); // can't sign multiple times to fool the threshhold
            previousSigner = signer;
        }
    }
}
