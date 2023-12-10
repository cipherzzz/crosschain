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
  destinationAccount: any
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const initialBalance = await destinationChain.asset.balanceOf(
    destinationAccount
  );

  const fee = await calculateBridgeFee(sourceChain, destinationChain);

  await (
    await sourceChain.bridge.bridgeAsset(
      destinationChain.name,
      destinationChain.bridge.address,
      sourceChain.asset.address,
      destinationChain.asset.address,
      amount,
      {
        value: fee,
        gasLimit: 500000,
      }
    )
  ).wait();

  while (true) {
    const updatedBalance = await destinationChain.asset.balanceOf(
      destinationAccount
    );
    if (updatedBalance.gt(initialBalance)) break;
    console.log(`Waiting for axelar...`);
    await sleep(1000);
  }
}
