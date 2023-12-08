import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";
import { POLYGON_NETWORK, FANTOM_NETWORK } from "../src/utils/networks";
import { Axelar_ERC20 } from "../src/utils/tokens";
import { getWallet } from "../src/utils/wallet";
import { deploy, execute, throttle } from "../src/axelar/axelar";
import { expect } from "chai";

describe("Axelar Complex", () => {
  describe("Axelar_ERC20", () => {
    let polygonContract;
    let fantomContract;
    it("should deploy the token", async () => {
      polygonContract = await deploy(
        Axelar_ERC20,
        POLYGON_NETWORK,
        getWallet(POLYGON_NETWORK)
      );
      fantomContract = await deploy(
        Axelar_ERC20,
        FANTOM_NETWORK,
        getWallet(FANTOM_NETWORK)
      );
      expect(polygonContract).to.exist;
      expect(fantomContract).to.exist;
    });

    it.skip("should not execute a transfer is beyond mint limit", async () => {
      const wallet = getWallet(POLYGON_NETWORK);
      await throttle(POLYGON_NETWORK, Axelar_ERC20.symbol, wallet, 100);

      const amount = 1000000;

      POLYGON_NETWORK.contract = polygonContract;
      FANTOM_NETWORK.contract = fantomContract;

      expect(
        execute(POLYGON_NETWORK, FANTOM_NETWORK, amount, wallet)
      ).to.be.revertedWith("Campaign has ended");
    });
    it("should execute a transfer", async () => {
      const amount = 100;
      POLYGON_NETWORK.contract = polygonContract;
      FANTOM_NETWORK.contract = fantomContract;

      const wallet = getWallet(POLYGON_NETWORK);
      const initialPolygonBalance = await POLYGON_NETWORK.contract.balanceOf(
        wallet.address
      );
      expect(initialPolygonBalance).to.equal(0);

      const initialFantomBalance = await FANTOM_NETWORK.contract.balanceOf(
        wallet.address
      );
      expect(initialFantomBalance).to.equal(0);

      await execute(POLYGON_NETWORK, FANTOM_NETWORK, wallet, amount);

      const finalPolygonBalance = await POLYGON_NETWORK.contract.balanceOf(
        wallet.address
      );
      expect(finalPolygonBalance).to.equal(0);

      const finalFantomBalance = await FANTOM_NETWORK.contract.balanceOf(
        wallet.address
      );
      expect(finalFantomBalance).to.equal(amount);
    });
  });
});
