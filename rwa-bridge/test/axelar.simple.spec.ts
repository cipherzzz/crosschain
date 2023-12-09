import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";
const RWA = require("../artifacts/contracts/axelar/token/simple/RWA.sol/RWA.json");
const DestinationBridge = require("../artifacts/contracts/axelar/bridge/DestinationBridge.sol/DestinationBridge.json");
const OriginBridge = require("../artifacts/contracts/axelar/bridge/OriginBridge.sol/OriginBridge.json");

import { getWallet } from "../src/utils/wallet";

describe("Crosschain", function () {
  const NAME = "Real World Asset";
  const SYMBOL = "RWA";
  const MAX_SINGLE_TRANSFER_AMOUNT = 1000000;
  const MAX_DAILY_TRANSFER_AMOUNT = 10000000;
  let polygonRWA: any;
  let fantomRWA: any;
  let polygonWallet: any;
  let fantomWallet: any;
  let polygonDestinationBridge: any;
  let fantomDestinationBridge: any;
  let polygonOriginBridge: any;
  let fantomOriginBridge: any;

  before(async function () {
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

    //deploy origin bridge to Polygon
    factory = new ContractFactory(
      OriginBridge.abi,
      OriginBridge.bytecode,
      polygonWallet
    );
    polygonOriginBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      POLYGON_NETWORK.gasService,
      polygonWallet.address
    );

    //deploy origin bridge to Fantom
    factory = new ContractFactory(
      OriginBridge.abi,
      OriginBridge.bytecode,
      fantomWallet
    );
    fantomOriginBridge = await factory.deploy(
      FANTOM_NETWORK.gateway,
      FANTOM_NETWORK.gasService,
      fantomWallet.address
    );

    //add assets to bridges
    polygonOriginBridge.addSupportedAsset(
      polygonRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
    fantomOriginBridge.addSupportedAsset(
      fantomRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );

    await polygonDestinationBridge.addSupportedAsset(polygonRWA.address);
    await fantomDestinationBridge.addSupportedAsset(fantomRWA.address);

    // Link bridges to each other
    await polygonRWA.setDestinationBridge(polygonDestinationBridge.address);
    await fantomRWA.setDestinationBridge(fantomDestinationBridge.address);

    await polygonDestinationBridge.addOriginBridge(
      FANTOM_NETWORK.name,
      fantomOriginBridge.address
    );
    await fantomDestinationBridge.addOriginBridge(
      POLYGON_NETWORK.name,
      polygonOriginBridge.address
    );
  });

  describe("Deployment", function () {
    it("Should deploy to Polygon and Fantom RWA assets and bridges correctly", async function () {
      expect(await polygonRWA.owner()).to.equal(polygonWallet.address);
      expect(await polygonRWA.name()).to.equal(NAME);
      expect(await polygonRWA.symbol()).to.equal(SYMBOL);

      expect(await fantomRWA.owner()).to.equal(fantomWallet.address);
      expect(await fantomRWA.name()).to.equal(NAME);
      expect(await fantomRWA.symbol()).to.equal(SYMBOL);

      expect(await polygonDestinationBridge.owner()).to.equal(
        polygonWallet.address
      );
      expect(await polygonDestinationBridge.gateway()).to.equal(
        POLYGON_NETWORK.gateway
      );
      expect(
        await polygonDestinationBridge.supportedAssets(polygonRWA.address)
      ).to.equal(true);

      expect(await fantomDestinationBridge.owner()).to.equal(
        fantomWallet.address
      );
      expect(await fantomDestinationBridge.gateway()).to.equal(
        FANTOM_NETWORK.gateway
      );
      expect(
        await fantomDestinationBridge.supportedAssets(fantomRWA.address)
      ).to.equal(true);
    });
  });
  // describe("Bridge Assets", async function () {
  //   it("Should bridge assets from Polygon to Fantom", async function () {
  //     const amount = 100;
  //     await polygonRWA.approve(polygonOriginBridge.address, amount);
  //     await polygonOriginBridge.bridgeAsset(
  //       polygonRWA.address,
  //       amount,
  //       FANTOM_NETWORK.name
  //     );
  //   });
  // });
});
