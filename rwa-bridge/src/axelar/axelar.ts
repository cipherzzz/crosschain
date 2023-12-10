"use strict";

const {
  ethers,
  getDefaultProvider,
  constants: { AddressZero },
  utils: { defaultAbiCoder },
} = require("ethers");

import { calculateBridgeFee } from "../../src/utils/wallet";

export async function bridgeAsset(
  sourceChain: any,
  destinationChain: any,
  amount: number,
  wallet: any
) {
  async function print() {
    console.log(
      `Balance at ${sourceChain.name} is ${await sourceChain.asset.balanceOf(
        wallet.address
      )}`
    );
    console.log(
      `Balance at ${
        destinationChain.name
      } is ${await destinationChain.asset.balanceOf(wallet.address)}`
    );
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const initialBalance = await destinationChain.asset.balanceOf(wallet.address);
  console.log("--- Initially ---");
  await print();

  const fee = await calculateBridgeFee(sourceChain, destinationChain);
  await (await sourceChain.asset.giveMe(amount)).wait();
  console.log("--- After getting some token on the sourceChain chain ---");
  await print();

  await (
    await sourceChain.bridge.bridgeAsset(
      destinationChain.name,
      destinationChain.bridge.address,
      sourceChain.asset.address,
      destinationChain.asset.address,
      amount,
      {
        value: fee,
      }
    )
  ).wait();

  while (true) {
    const updatedBalance = await destinationChain.asset.balanceOf(
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
