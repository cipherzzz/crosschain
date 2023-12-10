import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";
const RWA = require("../artifacts/contracts/axelar/token/simple/RWA.sol/RWA.json");
const DestinationBridge = require("../artifacts/contracts/axelar/bridge/DestinationBridge.sol/DestinationBridge.json");
const OriginBridge = require("../artifacts/contracts/axelar/bridge/OriginBridge.sol/OriginBridge.json");
import { calculateBridgeFee } from "../../local-axelar-env/scripts/libs/utils";

import { getWallet } from "../src/utils/wallet";
import { bridgeAsset } from "../src/axelar/axelar";

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
    await polygonRWA.deployed();

    //deploy RWA to Fantom
    fantomWallet = getWallet(FANTOM_NETWORK);
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(NAME, SYMBOL, fantomWallet.address);
    await fantomRWA.deployed();

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
    await polygonDestinationBridge.deployed();

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
    await fantomDestinationBridge.deployed();

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
    await polygonOriginBridge.deployed();

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
    await fantomOriginBridge.deployed();

    //add assets to bridges
    await polygonOriginBridge.addSupportedAsset(
      polygonRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );
    await fantomOriginBridge.addSupportedAsset(
      fantomRWA.address,
      MAX_SINGLE_TRANSFER_AMOUNT,
      MAX_DAILY_TRANSFER_AMOUNT
    );

    await polygonDestinationBridge.addSupportedAsset(polygonRWA.address);
    await fantomDestinationBridge.addSupportedAsset(fantomRWA.address);

    // Link bridges to each other
    await polygonRWA.setDestinationBridge(
      polygonDestinationBridge.address.toString()
    );
    await fantomRWA.setDestinationBridge(
      fantomDestinationBridge.address.toString()
    );

    await polygonDestinationBridge.addOriginBridge(
      FANTOM_NETWORK.name,
      fantomOriginBridge.address.toString()
    );
    await fantomDestinationBridge.addOriginBridge(
      POLYGON_NETWORK.name,
      polygonOriginBridge.address.toString()
    );

    await polygonDestinationBridge.addOriginBridge(
      FANTOM_NETWORK.name,
      fantomOriginBridge.address.toString()
    );
    await fantomDestinationBridge.addOriginBridge(
      POLYGON_NETWORK.name,
      polygonOriginBridge.address.toString()
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

    it("Should add assets to bridges", async function () {
      expect(
        await polygonOriginBridge.supportedAssets(polygonRWA.address)
      ).to.equal(true);
      expect(
        await fantomOriginBridge.supportedAssets(fantomRWA.address)
      ).to.equal(true);
    });
    it("Should link bridges to each other", async function () {
      expect(await polygonRWA.destinationBridge()).to.equal(
        polygonDestinationBridge.address
      );
      expect(await fantomRWA.destinationBridge()).to.equal(
        fantomDestinationBridge.address
      );

      expect(
        await polygonDestinationBridge.originChainToOriginBridge(
          FANTOM_NETWORK.name
        )
      ).to.equal(fantomOriginBridge.address);
      expect(
        await fantomDestinationBridge.originChainToOriginBridge(
          POLYGON_NETWORK.name
        )
      ).to.equal(polygonOriginBridge.address);
    });
    it("should execute a transfer", async () => {
      const amount = 100;
      POLYGON_NETWORK.contract = polygonRWA;
      FANTOM_NETWORK.contract = fantomRWA;

      const initialPolygonBalance = await polygonRWA.balanceOf(
        polygonWallet.address
      );
      expect(initialPolygonBalance).to.equal(0);

      const initialFantomBalance = await fantomRWA.balanceOf(
        fantomWallet.address
      );
      expect(initialFantomBalance).to.equal(0);

      //     sourceChain: any,
      // destinationChain: any,
      // originBridge: any,
      // wallet: any,
      // amount: number

      // approve amount to origin bridge
      await polygonRWA.approve(polygonOriginBridge.address, amount);

      await bridgeAsset(
        POLYGON_NETWORK,
        FANTOM_NETWORK,
        polygonOriginBridge,
        polygonWallet,
        amount
      );

      const finalPolygonBalance = await polygonRWA.balanceOf(
        polygonWallet.address
      );
      expect(finalPolygonBalance).to.equal(0);

      const finalFantomBalance = await fantomRWA.balanceOf(
        fantomWallet.address
      );
      expect(finalFantomBalance).to.equal(amount);
    });
  });
});
