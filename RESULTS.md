# `Bridgr` Challenge

## Disclaimer
This was a cool challenge and I really enjoyed getting caught up with Axelar and testing out their product. I was not able integrate another protocol, but I did get it working with Axelar reasonably well and all within a local chain which was nice. I was not able to use WSL2 with VSCode with Codesubmit so I had to use a combo of cloud9 and my local machine.

## Environment
- Ubuntu 20.04
- Node v16.19.0

## Layout
The project is setup as a monorepo. 

- The `local-axelar-env` is just a local copy of the axelar examples. I use the ganache tooling that they have implemented to be able to run multiple evm chains locally and test everything in the same env. 
- The rwa-bridge directory is the hardhat project that contains the bridge code itself.
  
## Installation

```bash
# install node 16
nvm install 16

# clone the repo locally
git clone <secret-git-repo-url> ondo-finance
```

### Local Multichain Environment Setup

```bash
# Setup Test Chain
cd local-axelar-env

# Install dependencies
npm install

# Compile contracts
npm run build

# Generate sample credentials for the test chain
npm run setup

# Start the test chain
npm run start
```

Congratulations! You now have a local chain running 5 networks locally!

### Local Bridge Setup

```bash
# Setup Test Chain
cd rwa-bridge

# Install dependencies
npm install

# Compile contracts
npm run compile

# Create .env file
cp .example.env .env
```

### ENV Setup
At this point, you need to copy the `EVM_PRIVATE_KEY` value from the `local-axelar-env/.env` file and paste it into the `DEPLOYER_PRIVATE_KEY` entry in the `rwa-bridge/.env` file. This is the private key that will be used to deploy and interact with the contracts on the local chain as the owner account.



## Running It
The tests were written to show everything working in an atomic manner locally. The output of the tests is a good way to see the implemented functionality.

```bash

# From Root Project Directory

# Start the local chain in a new tab - if not already running
npm run local:chain:start

# Run the tests(root project directory)
npm run test:rwa:axelar:bridge
```

## Completed Bridge Tasks
- [x] Implemented Axelar Protocol
- [x] Supports Multiple Simple ERC20 Tokens
- [x] Supports Fantom and Polygon Networks
- [x] Supports Max Transfer Limits per Tx on a Chain/Asset Bucket Level
- [x] Supports Aggregate Daily Transfer Limits on a Chain/Asset Bucket Level  
- [x] Bridge is Pausable