# Feedback
- I was not able to use WSL2 with VSCode with Codesubmit - it just would hang. I had to create a cloud9 instance to do this exercise which is not ideal.... 


## 
Run the local chain
- pull the submodules
- install dependencies for submodules
- generate creds
  - npm run setup

## Checklist

### Baseline
- [] Use at least 2 message passing protocols from {Axelar, Layerzero, Wormhole}.
- [] Implement thresholds on destination bridge such that arbitrary thresholds can be set based on amounts, e.g., 100K bridge transfer needs 2 approvers (where a message delivered on destination chain by a message passing protocol is considered an approver, like Axelar).
- [] Admin must have the ability to define arbitrary thresholds.
- [x] The bridge must have the ability to be paused if needed.
- [x] The bridge must support multiple RWA ERC-20 tokens.
- [] The bridge must have a daily rate limit where no more tokens are minted if this limit is met.
- [x] There should be extensive tests for the bridge.

### Extra
- [] Use all 3 message passing protocols.
- [] Implement bucket level rate limiting based on source<>destination chain.
- [] Implement upgradability.
- [] Make all contracts have the same addresses on all EVM compatible chains.
- [] Require manual approver for certain thresholds (where a multisig of the issuer approves each transaction in that threshold).