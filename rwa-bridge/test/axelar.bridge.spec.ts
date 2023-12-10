import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";

const RWABridge = require("../artifacts/contracts/axelar/bridge/DestinationBridge.sol/DestinationBridge.json");
const RWA = require("../artifacts/contracts/axelar/token/RWA.sol/RWA.json");

import { getWallet } from "../src/utils/wallet";
import { bridgeAsset } from "../src/axelar/axelar";

describe("Crosschain", function () {
  const NAME = "Real World Asset";
  const SYMBOL = "RWA";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000000;
  const MAX_DAILY_TRANSFER_AMOUNT = 10000000;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonRWA: any;
  let fantomRWA: any;
  let polygonBridge: any;
  let fantomBridge: any;

  before(async function () {
    let factory: any;

    polygonWallet = getWallet(POLYGON_NETWORK);
    fantomWallet = getWallet(FANTOM_NETWORK);

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
  });

  describe("Deployment", function () {
    it("Should deploy to Polygon and Fantom RWA assets and bridges correctly", async function () {
      expect(await polygonBridge.gateway()).to.equal(POLYGON_NETWORK.gateway);
      expect(await polygonBridge.gasService()).to.equal(
        POLYGON_NETWORK.gasService
      );

      expect(await fantomBridge.gateway()).to.equal(FANTOM_NETWORK.gateway);
      expect(await fantomBridge.gasService()).to.equal(
        FANTOM_NETWORK.gasService
      );
    });
  });
  describe("Send Message", function () {
    it("Should bridge asset from Polygon to Fantom", async function () {
      const amount = 1000;
      await polygonRWA.approve(POLYGON_NETWORK.bridge.address, amount);
      await bridgeAsset(POLYGON_NETWORK, FANTOM_NETWORK, amount, polygonWallet);
    });
  });
});
