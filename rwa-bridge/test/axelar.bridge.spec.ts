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
  const NAME = "Real World Asset";
  const SYMBOL = "RWA";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000000;
  const MAX_DAILY_TRANSFER_AMOUNT = 10000000;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonAttackerWallet: any;
  let fantomAttackerWallet: any;
  let polygonRWA: any;
  let fantomRWA: any;
  let polygonBridge: any;
  let fantomBridge: any;

  const resetWallets = async () => {
    polygonWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomWallet = getDeployerWallet(FANTOM_NETWORK);
    polygonAttackerWallet = getAttackerWallet(POLYGON_NETWORK);
    fantomAttackerWallet = getAttackerWallet(FANTOM_NETWORK);

    // burn tokens
    let polygonWalletAmount = polygonRWA.balanceOf(polygonWallet.address);
    if (polygonWalletAmount > 0) {
      await polygonRWA.burn(polygonWalletAmount);
    }

    let fantomWalletAmount = fantomRWA.balanceOf(fantomWallet.address);
    if (fantomWalletAmount > 0) {
      await fantomRWA.burn(fantomWalletAmount);
    }

    let polygonAttackerWalletAmount = polygonRWA.balanceOf(
      polygonAttackerWallet.address
    );
    if (polygonAttackerWalletAmount > 0) {
      await polygonRWA.burn(polygonAttackerWalletAmount);
    }

    let fantomAttackerWalletAmount = fantomRWA.balanceOf(
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

  before(async function () {
    let factory: any;

    polygonWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomWallet = getDeployerWallet(FANTOM_NETWORK);
    polygonAttackerWallet = getDeployerWallet(POLYGON_NETWORK);
    fantomAttackerWallet = getDeployerWallet(FANTOM_NETWORK);

    //deploy RWA to Polygon
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonRWA = await factory.deploy(NAME, SYMBOL, polygonWallet.address);
    await polygonRWA.deployed();

    //deploy RWA to Fantom
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(NAME, SYMBOL, fantomWallet.address);
    await fantomRWA.deployed();

    POLYGON_NETWORK.asset = polygonRWA;
    FANTOM_NETWORK.asset = fantomRWA;

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

    await polygonBridge.addSupportedAsset(polygonRWA.address);
    await fantomBridge.addSupportedAsset(fantomRWA.address);
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
          AMOUNT,
          fantomWallet.address
        );

        expect(await polygonRWA.balanceOf(polygonWallet.address)).to.equal(0);
        expect(await fantomRWA.balanceOf(fantomWallet.address)).to.equal(
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
      //it should not allow bridging if sender is not owner
      it("Should not bridge asset from Polygon to Fantom if sender is not owner", async function () {
        const AMOUNT = 1000;
        await polygonRWA.mint(AMOUNT);
        await polygonRWA.approve(POLYGON_NETWORK.bridge.address, AMOUNT);

        POLYGON_NETWORK.bridge = polygonBridge.connect(polygonAttackerWallet);

        await expect(
          bridgeAsset(
            POLYGON_NETWORK,
            FANTOM_NETWORK,
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
            AMOUNT,
            fantomWallet.address
          )
        ).to.be.rejected;
      });
    });
  });
});
