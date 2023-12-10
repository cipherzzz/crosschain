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
  symbol: string,
  amount: number,
  destinationAccount: any
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const initialBalance = await destinationChain.assets[symbol].balanceOf(
    destinationAccount
  );

  const fee = await calculateBridgeFee(sourceChain, destinationChain);

  await (
    await sourceChain.bridge.bridgeAsset(
      destinationChain.name,
      destinationChain.bridge.address,
      sourceChain.assets[symbol].address,
      destinationChain.assets[symbol].address,
      amount,
      {
        value: fee,
        gasLimit: 500000,
      }
    )
  ).wait();

  while (true) {
    const updatedBalance = await destinationChain.assets[symbol].balanceOf(
      destinationAccount
    );
    if (updatedBalance.gt(initialBalance)) break;
    console.log(`Waiting for axelar...`);
    await sleep(1000);
  }
}
