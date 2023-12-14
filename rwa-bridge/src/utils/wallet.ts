import { Wallet, getDefaultProvider, utils } from "ethers";
const {
  AxelarAssetTransfer,
  AxelarQueryAPI,
  CHAINS,
  Environment,
} = require("@axelar-network/axelarjs-sdk");

export const getWalletForNetwork = (network: any, signer: any): any => {
  const provider = getDefaultProvider(network.rpc);
  const wallet = signer.connect(provider);
  return wallet;
};

export const getWallets = async (network: any) => {
  const deployer = getWalletForNetwork(
    network,
    new Wallet(process.env.DEPLOYER_PRIVATE_KEY)
  );
  const attacker = getWalletForNetwork(
    network,
    new Wallet(process.env.ATTACKER_PRIVATE_KEY)
  );
  const bob = getWalletForNetwork(
    network,
    new Wallet(process.env.BOB_PRIVATE_KEY)
  );
  const alice = getWalletForNetwork(
    network,
    new Wallet(process.env.ALICE_PRIVATE_KEY)
  );
  const mark = getWalletForNetwork(
    network,
    new Wallet(process.env.MARK_PRIVATE_KEY)
  );

  await deployer.sendTransaction({
    to: attacker.address,
    value: utils.parseEther("1"),
  });
  await deployer.sendTransaction({
    to: bob.address,
    value: utils.parseEther("1"),
  });
  await deployer.sendTransaction({
    to: alice.address,
    value: utils.parseEther("1"),
  });
  await deployer.sendTransaction({
    to: mark.address,
    value: utils.parseEther("1"),
  });

  return {
    deployer,
    attacker,
    bob,
    alice,
    mark,
  };
};

/**
 * Calculate the gas amount for a transaction using axelarjs-sdk.
 * @param {*} source - The source chain object.
 * @param {*} destination - The destination chain object.
 * @param {*} options - The options to pass to the estimateGasFee function. Available options are gas token symbol, gasLimit and gasMultiplier.
 * @returns {number} - The gas amount.
 */
export function calculateBridgeFee(source, destination, options = {}) {
  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
  const { gasLimit, gasMultiplier, symbol } = options;

  return api.estimateGasFee(
    CHAINS.TESTNET[source.name.toUpperCase()],
    CHAINS.TESTNET[destination.name.toUpperCase()],
    symbol || source.tokenSymbol,
    gasLimit,
    gasMultiplier
  );
}
