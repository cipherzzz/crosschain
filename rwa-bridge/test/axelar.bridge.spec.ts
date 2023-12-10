import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";
const RWABridge = require("../artifacts/contracts/axelar/bridge/AxelarRWABridge.sol/AxelarRWABridge.json");

import { getWallet } from "../src/utils/wallet";
import { sendMessage } from "../src/axelar/axelar";

describe("Crosschain", function () {
  const NAME = "Real World Asset";
  const SYMBOL = "RWA";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000000;
  const MAX_DAILY_TRANSFER_AMOUNT = 10000000;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonBridge: any;
  let fantomBridge: any;

  before(async function () {
    let factory: any;

    polygonWallet = getWallet(POLYGON_NETWORK);
    fantomWallet = getWallet(FANTOM_NETWORK);

    // deploy destination bridge to Polygon
    factory = new ContractFactory(
      RWABridge.abi,
      RWABridge.bytecode,
      polygonWallet
    );
    polygonBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      POLYGON_NETWORK.gasService
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
      FANTOM_NETWORK.gasService
    );
    await fantomBridge.deployed();

    POLYGON_NETWORK.contract = polygonBridge;
    FANTOM_NETWORK.contract = fantomBridge;
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
    it("Should send a message from Polygon to Fantom", async function () {
      const message = "Hello Fantom! Love Polygon.";
      await sendMessage(POLYGON_NETWORK, FANTOM_NETWORK, message);
    });

    it("Should send a message from Fantom to Polygon", async function () {
      const message = "Hello Polygon! Love Fantom.";
      await sendMessage(FANTOM_NETWORK, POLYGON_NETWORK, message);
    });
  });
});
