"use strict";

const {
  ethers,
  getDefaultProvider,
  constants: { AddressZero },
  utils: { defaultAbiCoder },
} = require("ethers");
const { deployUpgradable } = require("@axelar-network/axelar-gmp-sdk-solidity");

const ExampleProxy = require("../../artifacts/contracts/axelar/token/complex/Proxy.sol/ExampleProxy.json");
const ERC20CrossChain = require("../../artifacts/contracts/axelar/token/complex/ERC20CrossChain.sol/ERC20CrossChain.json");

import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";
import { calculateBridgeFee } from "../../src/utils/wallet";

export async function deploy(token: any, chain: any, wallet: any): any {
  console.log(`Deploying ERC20CrossChain for ${chain.name}.`);
  const provider = getDefaultProvider(chain.rpc);
  chain.wallet = wallet.connect(provider);
  chain.contract = await deployUpgradable(
    chain.constAddressDeployer,
    wallet,
    ERC20CrossChain,
    ExampleProxy,
    [chain.gateway, chain.gasService, token.decimals],
    [],
    defaultAbiCoder.encode(["string", "string"], [token.name, token.symbol]),
    "cross-chain-token"
  );
  console.log(
    `Deployed ERC20CrossChain for ${chain.name} at ${chain.contract.address}.`
  );

  return chain.contract;
}

export async function execute(
  sourceChain: any,
  destinationChain: any,
  wallet: any,
  amount: number
) {
  async function print() {
    console.log(
      `Balance at ${sourceChain.name} is ${await sourceChain.contract.balanceOf(
        wallet.address
      )}`
    );
    console.log(
      `Balance at ${
        destinationChain.name
      } is ${await destinationChain.contract.balanceOf(wallet.address)}`
    );
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const initialBalance = await destinationChain.contract.balanceOf(
    wallet.address
  );
  console.log("--- Initially ---");
  await print();

  const fee = await calculateBridgeFee(sourceChain, destinationChain);
  await (await sourceChain.contract.giveMe(amount)).wait();
  console.log("--- After getting some token on the sourceChain chain ---");
  await print();

  await (
    await sourceChain.contract.transferRemote(
      destinationChain.name,
      wallet.address,
      amount,
      {
        value: fee,
      }
    )
  ).wait();

  while (true) {
    const updatedBalance = await destinationChain.contract.balanceOf(
      wallet.address
    );
    if (updatedBalance.gt(initialBalance)) break;
    console.log(
      `Waiting for transfer to be processed. Current balance is ${updatedBalance}`
    );
    await sleep(2000);
  }

  console.log("--- After ---");
  await print();
}

export const throttle = async (
  network: any,
  symbol: string,
  wallet: any,
  limit: number
) => {
  const gateway = new ethers.Contract(
    network.gateway,
    [
      "function setTokenMintLimits(string[] calldata symbols, uint256[] calldata limits) external",
      "function tokenMintLimit(string memory symbol) external view returns (uint256)",
      "function tokenMintAmount(string memory symbol) external view returns (uint256)",
      "function allTokensFrozen() external view returns (bool)",
    ],
    wallet
  );
  const currentLimit = await gateway.tokenMintLimit(symbol);
  console.log(`Current mint limit for ${symbol} is ${currentLimit}`);
  await gateway.setTokenMintLimits([symbol], [limit]);
};
