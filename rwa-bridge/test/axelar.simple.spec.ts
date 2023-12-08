import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";
const RWA = require("../artifacts/contracts/axelar/token/simple/RWA.sol/RWA.json");
const DestinationBridge = require("../artifacts/contracts/axelar/bridge/DestinationBridge.sol/DestinationBridge.json");
import { getWallet } from "../src/utils/wallet";

describe("Escrow", function () {
  const NAME = "Real World Asset";
  const SYMBOL = "RWA";
  const POLYGON_MINT_LIMIT = 1000000;
  const FANTOM_MINT_LIMIT = 2000000;
  let polygonRWA: any;
  let fantomRWA: any;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonDestinationBridge: any;
  let fantomDestinationBridge: any;

  beforeEach(async function () {
    let factory: any;

    //deploy RWA to Polygon
    polygonWallet = getWallet(POLYGON_NETWORK);
    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonRWA = await factory.deploy(NAME, SYMBOL, polygonWallet.address);

    //deploy RWA to Fantom
    fantomWallet = getWallet(FANTOM_NETWORK);
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(NAME, SYMBOL, fantomWallet.address);

    // deploy destination bridge to Polygon
    factory = new ContractFactory(
      DestinationBridge.abi,
      DestinationBridge.bytecode,
      polygonWallet
    );
    polygonDestinationBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      polygonWallet.address
    );

    // deploy destination bridge to Fantom
    factory = new ContractFactory(
      DestinationBridge.abi,
      DestinationBridge.bytecode,
      fantomWallet
    );
    fantomDestinationBridge = await factory.deploy(
      FANTOM_NETWORK.gateway,
      fantomWallet.address
    );

    //configure bridges
    await polygonRWA.setAxelarBridge(polygonDestinationBridge.address);
    await fantomRWA.setAxelarBridge(fantomDestinationBridge.address);
  });

  describe("Deployment", function () {
    it("Should deploy to Polygon and Fantom RWA assets and bridges correctly", async function () {
      expect(await polygonRWA.owner()).to.equal(polygonWallet.address);
      expect(await polygonRWA.name()).to.equal(NAME);
      expect(await polygonRWA.symbol()).to.equal(SYMBOL);

      expect(await fantomRWA.owner()).to.equal(fantomWallet.address);
      expect(await fantomRWA.name()).to.equal(NAME);
      expect(await fantomRWA.symbol()).to.equal(SYMBOL);
    });
  });
  describe("Bridge", function () {});
});
