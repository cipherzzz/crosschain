import { expect } from "chai";
import { ContractFactory, ethers } from "ethers";
import { FANTOM_NETWORK, POLYGON_NETWORK } from "../src/utils/networks";
const RWA = require("../artifacts/contracts/axelar/token/simple/RWAToken.sol/RWAToken.json");
const DestinationBridge = require("../artifacts/contracts/axelar/bridge/AxelarDestinationBridge.sol/AxelarDestinationBridge.json");
const OriginBridge = require("../artifacts/contracts/axelar/bridge/AxelarSourceBridge.sol/AxelarSourceBridge.json");

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
    polygonRWA = await factory.deploy(polygonWallet.address, NAME, SYMBOL);
    await polygonRWA.deployed();

    //deploy RWA to Fantom
    fantomWallet = getWallet(FANTOM_NETWORK);
    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(fantomWallet.address, NAME, SYMBOL);
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
      polygonWallet.address,
      [polygonRWA.address],
      [MAX_SINGLE_TRANSFER_AMOUNT],
      [MAX_DAILY_TRANSFER_AMOUNT]
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
      fantomWallet.address,
      [fantomRWA.address],
      [MAX_SINGLE_TRANSFER_AMOUNT],
      [MAX_DAILY_TRANSFER_AMOUNT]
    );
    await fantomOriginBridge.deployed();

    factory = new ContractFactory(RWA.abi, RWA.bytecode, polygonWallet);
    polygonRWA = await factory.deploy(polygonWallet.address, NAME, SYMBOL);
    await polygonRWA.deployed();

    console.log("Polygon RWA: ", polygonRWA.address);

    //deploy RWA to Fantom

    factory = new ContractFactory(RWA.abi, RWA.bytecode, fantomWallet);
    fantomRWA = await factory.deploy(fantomWallet.address, NAME, SYMBOL);
    await fantomRWA.deployed();

    console.log("Fantom RWA: ", fantomRWA.address);

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

    console.log(
      "Polygon Destination Bridge: ",
      polygonDestinationBridge.address
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
    await fantomDestinationBridge.deployed();

    console.log("Fantom Destination Bridge: ", fantomDestinationBridge.address);

    //deploy origin bridge to Polygon
    factory = new ContractFactory(
      OriginBridge.abi,
      OriginBridge.bytecode,
      polygonWallet
    );
    polygonOriginBridge = await factory.deploy(
      POLYGON_NETWORK.gateway,
      POLYGON_NETWORK.gasService,
      polygonWallet.address,
      [polygonRWA.address],
      [MAX_SINGLE_TRANSFER_AMOUNT],
      [MAX_DAILY_TRANSFER_AMOUNT]
    );
    await polygonOriginBridge.deployed();

    console.log("Polygon Origin Bridge: ", polygonOriginBridge.address);

    //deploy origin bridge to Fantom
    factory = new ContractFactory(
      OriginBridge.abi,
      OriginBridge.bytecode,
      fantomWallet
    );
    fantomOriginBridge = await factory.deploy(
      FANTOM_NETWORK.gateway,
      FANTOM_NETWORK.gasService,
      fantomWallet.address,
      [fantomRWA.address],
      [MAX_SINGLE_TRANSFER_AMOUNT],
      [MAX_DAILY_TRANSFER_AMOUNT]
    );
    await fantomOriginBridge.deployed();

    console.log("Fantom Origin Bridge: ", fantomOriginBridge.address);

    console.log("Polygon RWA: ", polygonRWA.address);
    console.log("Fantom RWA: ", fantomRWA.address);
    console.log(
      "Polygon Destination Bridge: ",
      polygonDestinationBridge.address
    );
    console.log("Fantom Destination Bridge: ", fantomDestinationBridge.address);
    console.log("Polygon Origin Bridge: ", polygonOriginBridge.address);
    console.log("Fantom Origin Bridge: ", fantomOriginBridge.address);

    await polygonDestinationBridge.addSupportedToken(polygonRWA.address);
    await fantomDestinationBridge.addSupportedToken(fantomRWA.address);

    // Link bridges to each other
    await polygonRWA.setBridge(polygonDestinationBridge.address.toString());
    await fantomRWA.setBridge(fantomDestinationBridge.address.toString());

    // add destination chains to origin bridges
    await polygonOriginBridge.addDestinationChain(
      FANTOM_NETWORK.name,
      fantomOriginBridge.address.toString()
    );
    await fantomOriginBridge.addDestinationChain(
      POLYGON_NETWORK.name,
      polygonOriginBridge.address.toString()
    );

    await polygonDestinationBridge.addChainSupport(
      FANTOM_NETWORK.name,
      fantomOriginBridge.address.toString()
    );
    await fantomDestinationBridge.addChainSupport(
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
        await polygonDestinationBridge.supportedTokens(polygonRWA.address)
      ).to.equal(true);

      expect(await fantomDestinationBridge.owner()).to.equal(
        fantomWallet.address
      );
      expect(await fantomDestinationBridge.gateway()).to.equal(
        FANTOM_NETWORK.gateway
      );
      expect(
        await fantomDestinationBridge.supportedTokens(fantomRWA.address)
      ).to.equal(true);
    });

    it("Should add assets to bridges", async function () {
      expect(
        await polygonOriginBridge.supportedTokens(polygonRWA.address)
      ).to.equal(true);
      expect(
        await fantomOriginBridge.supportedTokens(fantomRWA.address)
      ).to.equal(true);
    });
    it("Should link bridges to each other", async function () {
      expect(await polygonRWA.bridge()).to.equal(
        polygonDestinationBridge.address
      );
      expect(await fantomRWA.bridge()).to.equal(
        fantomDestinationBridge.address
      );

      expect(
        await polygonDestinationBridge.srcChainToSrcBridge(FANTOM_NETWORK.name)
      ).to.equal(fantomOriginBridge.address.toString());
      expect(
        await fantomDestinationBridge.srcChainToSrcBridge(POLYGON_NETWORK.name)
      ).to.equal(polygonOriginBridge.address.toString());
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
