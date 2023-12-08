import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localPolygon: {
      url: `http://localhost:8500/4`,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    localFantom: {
      url: `http://localhost:8500/2`,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
