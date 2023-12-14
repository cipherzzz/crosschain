import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";

const RWABridge = require("../artifacts/contracts/axelar/bridge/RWABridge.sol/RWABridge.json");
const RWA = require("../artifacts/contracts/axelar/token/RWA.sol/RWA.json");

import { getWallets } from "../src/utils/wallet";
import { BridgeTx, bridgeAsset } from "../src/axelar/axelar";

const getDigest = (bridgeTx: BridgeTx, nonce: number) => {
  let encoded = ethers.utils.defaultAbiCoder.encode(
    ["tuple(string, string, address, address, uint256)"],
    [
      [
        bridgeTx.destinationChain,
        bridgeTx.destinationBridgeAddress,
        bridgeTx.assetToBurn,
        bridgeTx.assetToMint,
        bridgeTx.amount,
      ],
    ]
  );
  let encodedWithNonce = ethers.utils.solidityPack(
    ["bytes", "uint256"],
    [encoded, nonce]
  );

  let digest = ethers.utils.keccak256(encodedWithNonce);
  return digest;
};

describe("Crosschain", async function () {
  const RWA_NAME = "Real World Asset";
  const RWA_SYMBOL = "RWA";
  const RWA_NAME2 = "Real World Asset Deux";
  const RWA_SYMBOL2 = "RWADEUX";
  const UNKNOWN = "UNKNOWN";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000;
  const MAX_DAILY_TRANSFER_AMOUNT = 1500;

  let polygonOwnerWallet: any;
  let polygonAttackerWallet: any;
  let polygonAliceWallet: any;
  let polygonBobWallet: any;
  let polygonMarkWallet: any;

  let fantomOwnerWallet: any;
  let fantomAttackerWallet: any;

  let polygonRWA: any;
  let fantomRWA: any;
  let polygonRWA2: any;
  let fantomRWA2: any;
  let polygonUnknown: any;
  let fantomUnknown: any;
  let polygonBridge: any;
  let fantomBridge: any;

  let multiSigSigners: any;
  let multiSigSignerAddresses: any = [];

  before(async function () {
    let factory: any;

    const polygonWallets = await getWallets(POLYGON_NETWORK);
    polygonOwnerWallet = polygonWallets.deployer;
    polygonAttackerWallet = polygonWallets.attacker;
    polygonAliceWallet = polygonWallets.alice;
    polygonBobWallet = polygonWallets.bob;
    polygonMarkWallet = polygonWallets.mark;

    const fantomWallets = await getWallets(FANTOM_NETWORK);
    fantomOwnerWallet = fantomWallets.deployer;
    fantomAttackerWallet = fantomWallets.attacker;

    multiSigSigners = [polygonBobWallet, polygonAliceWallet].sort((a, b) =>
      a.address > b.address ? 1 : -1
    );
    for (let signer of multiSigSigners) {
      multiSigSignerAddresses.push(signer.address);
    }

    //deploy RWA to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonOwnerWallet);
    polygonRWA = await factory.deploy(
      RWA_NAME,
      RWA_SYMBOL,
      polygonOwnerWallet.address
    );
    await polygonRWA.deployed();

    //deploy RWA to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomOwnerWallet);
    fantomRWA = await factory.deploy(
      RWA_NAME,
      RWA_SYMBOL,
      fantomOwnerWallet.address
    );
    await fantomRWA.deployed();

    // deploy RWA2 to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonOwnerWallet);
    polygonRWA2 = await factory.deploy(
      RWA_NAME2,
      RWA_SYMBOL2,
      polygonOwnerWallet.address
    );
    await polygonRWA2.deployed();

    //deploy RWA2 to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomOwnerWallet);
    fantomRWA2 = await factory.deploy(
      RWA_NAME2,
      RWA_SYMBOL2,
      fantomOwnerWallet.address
    );
    await fantomRWA2.deployed();

    // deploy Unknown to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonOwnerWallet);
    polygonUnknown = await factory.deploy(
      UNKNOWN,
      UNKNOWN,
      polygonOwnerWallet.address
    );
    await polygonUnknown.deployed();

    // deploy Unknown to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomOwnerWallet);
    fantomUnknown = await factory.deploy(
      UNKNOWN,
      UNKNOWN,
      fantomOwnerWallet.address
    );
    await fantomUnknown.deployed();

    POLYGON_NETWORK.assets[RWA_SYMBOL] = polygonRWA;
    FANTOM_NETWORK.assets[RWA_SYMBOL] = fantomRWA;
    POLYGON_NETWORK.assets[RWA_SYMBOL2] = polygonRWA2;
    FANTOM_NETWORK.assets[RWA_SYMBOL2] = fantomRWA2;
    POLYGON_NETWORK.assets[UNKNOWN] = polygonUnknown;
    FANTOM_NETWORK.assets[UNKNOWN] = fantomUnknown;

    // deploy destination bridge to Polygon
    factory = new ContractFactory(
      RWABridge.abi,
      RWABridge.bytecode,
      polygonOwnerWallet
    );
    polygonBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      POLYGON_NETWORK.gasService,
      polygonOwnerWallet.address,
      multiSigSignerAddresses,
      2
    );
    await polygonBridge.deployed();

    // deploy destination bridge to Fantom
    factory = new ContractFactory(
      RWABridge.abi,
      RWABridge.bytecode,
      fantomOwnerWallet
    );
    fantomBridge = await factory.deploy(
      FANTOM_NETWORK.gateway,
      FANTOM_NETWORK.gasService,
      fantomOwnerWallet.address,
      multiSigSignerAddresses,
      2
    );
    await fantomBridge.deployed();

    POLYGON_NETWORK.bridge = polygonBridge;
    FANTOM_NETWORK.bridge = fantomBridge;

    await polygonRWA.setDestinationBridge(polygonBridge.address);
    await fantomRWA.setDestinationBridge(fantomBridge.address);
    await polygonRWA2.setDestinationBridge(polygonBridge.address);
    await fantomRWA2.setDestinationBridge(fantomBridge.address);

    await polygonBridge.addSupportedAsset(
      polygonRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
    await fantomBridge.addSupportedAsset(
      fantomRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
    await polygonBridge.addSupportedAsset(
      polygonRWA2.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
    await fantomBridge.addSupportedAsset(
      fantomRWA2.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
  });

  describe("Deployment", function () {
    it("Should deploy to Polygon and Fantom RWA assets and bridges correctly", async function () {
      expect(await polygonRWA.destinationBridge()).to.equal(
        polygonBridge.address
      );
      expect(await fantomRWA.destinationBridge()).to.equal(
        fantomBridge.address
      );

      expect(await polygonBridge.gateway()).to.equal(POLYGON_NETWORK.gateway);
      expect(await polygonBridge.gasService()).to.equal(
        POLYGON_NETWORK.gasService
      );

      expect(await fantomBridge.gateway()).to.equal(FANTOM_NETWORK.gateway);
      expect(await fantomBridge.gasService()).to.equal(
        FANTOM_NETWORK.gasService
      );

      expect(await polygonBridge.supportedAssets(polygonRWA.address)).to.equal(
        true
      );
      expect(await fantomBridge.supportedAssets(fantomRWA.address)).to.equal(
        true
      );
    });
  });
  describe("Bridge Assets", function () {
    describe("ヽ(•‿•)ノ Path", function () {
      it.only("Should bridge asset from Polygon to Fantom", async function () {
        const AMOUNT = 1000;
        const nonce = (await polygonBridge.nonce()) + 1;

        const bridgeTx: BridgeTx = {
          destinationChain: POLYGON_NETWORK.name,
          destinationBridgeAddress: FANTOM_NETWORK.bridge.address,
          assetToBurn: polygonRWA.address,
          assetToMint: fantomRWA.address,
          amount: AMOUNT,
        };

        console.log(bridgeTx);

        const digest = getDigest(bridgeTx, nonce);
        multiSigSigners.sort((x, y) => (x.address > y.address ? 1 : -1));
        let signatures = [];
        for (let signer of multiSigSigners) {
          let sign = await signer.signMessage(ethers.utils.arrayify(digest));
          signatures.push(sign);
        }

        await polygonRWA.mint(AMOUNT);

        const prevPolygonBalance = await polygonRWA.balanceOf(
          polygonOwnerWallet.address
        );
        const prevFantomBalance = await fantomRWA.balanceOf(
          fantomOwnerWallet.address
        );

        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);
        await bridgeAsset(
          POLYGON_NETWORK,
          FANTOM_NETWORK,
          RWA_SYMBOL,
          AMOUNT,
          fantomOwnerWallet.address,
          bridgeTx,
          nonce,
          signatures
        );

        const newPolygonBalance = await polygonRWA.balanceOf(
          polygonOwnerWallet.address
        );
        const newFantomBalance = await fantomRWA.balanceOf(
          fantomOwnerWallet.address
        );

        expect(newFantomBalance).to.equal(prevFantomBalance.add(AMOUNT));
        expect(newPolygonBalance).to.equal(prevPolygonBalance.sub(AMOUNT));
      }).timeout(100000);
      it("Should bridge asset from Fantom to Polygon", async function () {
        const AMOUNT = 1000;
        await fantomRWA.mint(AMOUNT);

        const prevPolygonBalance = await polygonRWA.balanceOf(
          polygonOwnerWallet.address
        );
        const prevFantomBalance = await fantomRWA.balanceOf(
          fantomOwnerWallet.address
        );

        await fantomRWA.approve(FANTOM_NETWORK.bridge.address, AMOUNT);
        await bridgeAsset(
          FANTOM_NETWORK,
          POLYGON_NETWORK,
          RWA_SYMBOL,
          AMOUNT,
          polygonOwnerWallet.address
        );

        const newPolygonBalance = await polygonRWA.balanceOf(
          polygonOwnerWallet.address
        );
        const newFantomBalance = await fantomRWA.balanceOf(
          fantomOwnerWallet.address
        );

        expect(newFantomBalance).to.equal(prevFantomBalance.sub(AMOUNT));
        expect(newPolygonBalance).to.equal(prevPolygonBalance.add(AMOUNT));
      });
      it("Should bridge a secondary asset from Polygon to Fantom", async function () {
        const AMOUNT = 1000;
        await polygonRWA2.mint(AMOUNT);

        const prevPolygonBalance = await polygonRWA2.balanceOf(
          polygonOwnerWallet.address
        );
        const prevFantomBalance = await fantomRWA2.balanceOf(
          fantomOwnerWallet.address
        );

        await polygonRWA2.approve(POLYGON_NETWORK.bridge.address, AMOUNT);
        await bridgeAsset(
          POLYGON_NETWORK,
          FANTOM_NETWORK,
          RWA_SYMBOL2,
          AMOUNT,
          fantomOwnerWallet.address
        );

        const newPolygonBalance = await polygonRWA2.balanceOf(
          polygonOwnerWallet.address
        );
        const newFantomBalance = await fantomRWA2.balanceOf(
          fantomOwnerWallet.address
        );

        expect(newFantomBalance).to.equal(prevFantomBalance.add(AMOUNT));
        expect(newPolygonBalance).to.equal(prevPolygonBalance.sub(AMOUNT));
      });

      it("Should allow bridges to be paused/resumed", async function () {
        await polygonBridge.pause();
        expect(await polygonBridge.paused()).to.be.equal(true);
        await polygonBridge.unpause();
        expect(await polygonBridge.paused()).to.be.equal(false);

        await fantomBridge.pause();
        expect(await fantomBridge.paused()).to.be.equal(true);
        await fantomBridge.unpause();
        expect(await fantomBridge.paused()).to.be.equal(false);
      });
    });
    describe("˙◠˙ Path", function () {
      it("Should not allow a bridge operation over the chain/token tx limit", async function () {
        const AMOUNT = MAX_SINGLE_TRANSFER_AMOUNT + 1;
        await polygonRWA.mint(AMOUNT);
        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            RWA_SYMBOL,
            AMOUNT,
            fantomOwnerWallet.address
          )
        ).to.be.rejected;
      });
      it("Should not allow a bridge operation that would exceed the aggregate daily limit for a chain/token", async function () {
        // We have transferred 1000 so far with Polygon/polygonRWA
        // Daily limit is 1500, so another 1000 should trip it
        const AMOUNT = MAX_SINGLE_TRANSFER_AMOUNT + 1;
        await polygonRWA.mint(AMOUNT);
        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            RWA_SYMBOL,
            AMOUNT,
            fantomOwnerWallet.address
          )
        ).to.be.rejected;
      });
      it("Should not allow an unknown asset to be bridged", async function () {
        const AMOUNT = 1000;

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            UNKNOWN,
            AMOUNT,
            fantomOwnerWallet.address
          )
        ).to.be.rejected;
      });
      it("Should not bridge asset from Polygon to Fantom if sender is not owner", async function () {
        const AMOUNT = 1000;
        await polygonRWA.mint(AMOUNT);
        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);

        POLYGON_NETWORK.bridge = polygonBridge.connect(polygonAttackerWallet);

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            RWA_SYMBOL,
            AMOUNT,
            fantomOwnerWallet.address
          )
        ).to.be.rejected;
      });

      it("Should not bridge asset from Polygon to Fantom if bridge is paused", async function () {
        const AMOUNT = 1000;
        polygonBridge.connect(polygonOwnerWallet);
        polygonBridge.pause();

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            RWA_SYMBOL,
            AMOUNT,
            fantomOwnerWallet.address
          )
        ).to.be.rejected;
      });
    });
  });
});
