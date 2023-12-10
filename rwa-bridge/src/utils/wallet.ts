import { Wallet, getDefaultProvider } from "ethers";
const {
  AxelarAssetTransfer,
  AxelarQueryAPI,
  CHAINS,
  Environment,
} = require("@axelar-network/axelarjs-sdk");

export const getDeployerWallet = (network: any): any => {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const signer = new Wallet(privateKey!);
  const provider = getDefaultProvider(network.rpc);
  const wallet = signer.connect(provider);
  return wallet;
};

export const getAttackerWallet = (network: any): any => {
  const privateKey = process.env.ATTACKER_PRIVATE_KEY;
  const signer = new Wallet(privateKey!);
  const provider = getDefaultProvider(network.rpc);
  const wallet = signer.connect(provider);
  return wallet;
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
