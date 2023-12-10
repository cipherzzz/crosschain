import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";

const RWABridge = require("../artifacts/contracts/axelar/bridge/RWABridge.sol/RWABridge.json");
const RWA = require("../artifacts/contracts/axelar/token/RWA.sol/RWA.json");

import {
  calculateBridgeFee,
  getAttackerWallet,
  getDeployerWallet,
} from "../src/utils/wallet";
import { bridgeAsset } from "../src/axelar/axelar";

describe("Crosschain", function () {
  const RWA_NAME = "Real World Asset";
  const RWA_SYMBOL = "RWA";
  const RWA_NAME2 = "Real World Asset Deux";
  const RWA_SYMBOL2 = "RWADEUX";
  const UNKNOWN = "UNKNOWN";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000;
  const MAX_DAILY_TRANSFER_AMOUNT = 1500;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonAttackerWallet: any;
  let fantomAttackerWallet: any;
  let polygonRWA: any;
  let fantomRWA: any;
  let polygonRWA2: any;
  let fantomRWA2: any;
  let polygonUnknown: any;
  let fantomUnknown: any;
  let polygonBridge: any;
  let fantomBridge: any;

  before(async function () {
    let factory: any;

    polygonWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomWallet = getDeployerWallet(FANTOM_NETWORK);
    polygonAttackerWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomAttackerWallet = getDeployerWallet(FANTOM_NETWORK);

    //deploy RWA to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonRWA = await factory.deploy(
      RWA_NAME,
      RWA_SYMBOL,
      polygonWallet.address
    );
    await polygonRWA.deployed();

    //deploy RWA to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(
      RWA_NAME,
      RWA_SYMBOL,
      fantomWallet.address
    );
    await fantomRWA.deployed();

    // deploy RWA2 to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonRWA2 = await factory.deploy(
      RWA_NAME2,
      RWA_SYMBOL2,
      polygonWallet.address
    );
    await polygonRWA2.deployed();

    //deploy RWA2 to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA2 = await factory.deploy(
      RWA_NAME2,
      RWA_SYMBOL2,
      fantomWallet.address
    );
    await fantomRWA2.deployed();

    // deploy Unknown to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonUnknown = await factory.deploy(
      UNKNOWN,
      UNKNOWN,
      polygonWallet.address
    );
    await polygonUnknown.deployed();

    // deploy Unknown to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomUnknown = await factory.deploy(
      UNKNOWN,
      UNKNOWN,
      fantomWallet.address
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
      polygonWallet
    );
    polygonBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      POLYGON_NETWORK.gasService,
      polygonWallet.address
    );
    await polygonBridge.deployed();

    // deploy destination bridge to Fantom
    factory = new ContractFactory(
      RWABridge.abi,
      RWABridge.bytecode,
      fantomWallet
    );
    fantomBridge = await factory.deploy(
      FANTOM_NETWORK.gateway,
      FANTOM_NETWORK.gasService,
      fantomWallet.address
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
      it("Should bridge asset from Polygon to Fantom", async function () {
        await resetWallets();
        const AMOUNT = 1000;
        await polygonRWA.mint(AMOUNT);

        expect(await polygonRWA.balanceOf(polygonWallet.address)).to.equal(
          AMOUNT
        );
        expect(await fantomRWA.balanceOf(fantomWallet.address)).to.equal(0);

        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);
        await bridgeAsset(
          POLYGON_NETWORK,
          FANTOM_NETWORK,
          RWA_SYMBOL,
          AMOUNT,
          fantomWallet.address
        );

        expect(await polygonRWA.balanceOf(polygonWallet.address)).to.equal(0);
        expect(await fantomRWA.balanceOf(fantomWallet.address)).to.equal(
          AMOUNT
        );
      });
      it("Should bridge a secondary asset from Polygon to Fantom", async function () {
        await resetWallets();
        const AMOUNT = 1000;
        await polygonRWA2.mint(AMOUNT);

        expect(await polygonRWA2.balanceOf(polygonWallet.address)).to.equal(
          AMOUNT
        );
        expect(await fantomRWA2.balanceOf(fantomWallet.address)).to.equal(0);

        await polygonRWA2.approve(POLYGON_NETWORK.bridge.address, AMOUNT);
        await bridgeAsset(
          POLYGON_NETWORK,
          FANTOM_NETWORK,
          RWA_SYMBOL2,
          AMOUNT,
          fantomWallet.address
        );

        expect(await polygonRWA2.balanceOf(polygonWallet.address)).to.equal(0);
        expect(await fantomRWA2.balanceOf(fantomWallet.address)).to.equal(
          AMOUNT
        );
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
            fantomWallet.address
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
            fantomWallet.address
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
            fantomWallet.address
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
            fantomWallet.address
          )
        ).to.be.rejected;
      });

      it("Should not bridge asset from Polygon to Fantom if bridge is paused", async function () {
        const AMOUNT = 1000;
        polygonBridge.connect(polygonWallet);
        polygonBridge.pause();

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
            RWA_SYMBOL,
            AMOUNT,
            fantomWallet.address
          )
        ).to.be.rejected;
      });
    });
  });

  const resetWallets = async () => {
    polygonWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomWallet = getDeployerWallet(FANTOM_NETWORK);
    polygonAttackerWallet = getAttackerWallet(POLYGON_NETWORK);
    fantomAttackerWallet = getAttackerWallet(FANTOM_NETWORK);

    // burn tokens
    let polygonWalletAmount = await polygonRWA.balanceOf(polygonWallet.address);
    if (polygonWalletAmount > 0) {
      await polygonRWA.burn(polygonWalletAmount);
    }

    let fantomWalletAmount = await fantomRWA.balanceOf(fantomWallet.address);
    if (fantomWalletAmount > 0) {
      await fantomRWA.burn(fantomWalletAmount);
    }

    let polygonAttackerWalletAmount = await polygonRWA.balanceOf(
      polygonAttackerWallet.address
    );
    if (polygonAttackerWalletAmount > 0) {
      await polygonRWA.burn(polygonAttackerWalletAmount);
    }

    let fantomAttackerWalletAmount = await fantomRWA.balanceOf(
      fantomAttackerWallet.address
    );
    if (fantomAttackerWalletAmount > 0) {
      await fantomRWA.burn(fantomAttackerWalletAmount);
    }

    expect(await polygonRWA.balanceOf(polygonWallet.address)).to.equal(0);
    expect(await fantomRWA.balanceOf(fantomWallet.address)).to.equal(0);
    expect(await polygonRWA.balanceOf(polygonAttackerWallet.address)).to.equal(
      0
    );
    expect(await fantomRWA.balanceOf(fantomAttackerWallet.address)).to.equal(0);
  };
});
