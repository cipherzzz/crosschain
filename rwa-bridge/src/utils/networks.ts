export const POLYGON_NETWORK = {
  name: "Polygon",
  chainId: 2504,
  gateway: "0xc7B788E88BAaB770A6d4936cdcCcd5250E1bbAd8",
  gasService: "0xC573c722e21eD7fadD38A8f189818433e01Ae466",
  constAddressDeployer: "0x69aeB7Dc4f2A86873Dae8D753DE89326Cf90a77a",
  create3Deployer: "0x783E7717fD4592814614aFC47ee92568a495Ce0B",
  tokens: { aUSDC: "aUSDC" },
  rpc: "http://localhost:8500/4",
  bridge: null,
  asset: null,
};

export const FANTOM_NETWORK = {
  name: "Fantom",
  chainId: 2502,
  gateway: "0xcb189eB52ca573eFD633d07A3B5357e4d989D743",
  gasService: "0x85Fa9202C6Be69e9889CC0247Af72ABc70DbF542",
  constAddressDeployer: "0x69aeB7Dc4f2A86873Dae8D753DE89326Cf90a77a",
  create3Deployer: "0x783E7717fD4592814614aFC47ee92568a495Ce0B",
  tokens: { aUSDC: "aUSDC" },
  rpc: "http://localhost:8500/2",
  bridge: null,
  asset: null,
};

export const MUMBAI_NETWORK = {
  name: "Polygon",
  chainId: 80001,
  gateway: "0xBF62ef1486468a6bd26Dd669C06db43dEd5B849B",
  gasService: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  constAddressDeployer: "0x69aeB7Dc4f2A86873Dae8D753DE89326Cf90a77a",
  create3Deployer: "0x783E7717fD4592814614aFC47ee92568a495Ce0B",
  tokens: { aUSDC: "aUSDC" },
  rpc: "https://rpc-mumbai.maticvigil.com/",
  contract: "0xF4a9cbaC85bB88076531411A9f3Abad1D3bB347c",
  sourceBridge: "0xF4590b03C50180a64421f2A27f3470947ca26262",
  destinationBridge: "0xD1A880753B91C671661F35d40053892f94e267e2",
};

export const BSCTESTNET_NETWORK = {
  name: "binance",
  chainId: 97,
  gateway: "0x4D147dCb984e6affEEC47e44293DA442580A3Ec0",
  gasService: "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6",
  constAddressDeployer: "0x69aeB7Dc4f2A86873Dae8D753DE89326Cf90a77a",
  create3Deployer: "0x783E7717fD4592814614aFC47ee92568a495Ce0B",
  tokens: { aUSDC: "aUSDC" },
  rpc: "https://rpc-mumbai.maticvigil.com/",
  contract: "0x580cC8d137eC825cA792447D4B1e7C6c92Fb6FE5",
  sourceBridge: "0x06A942f30AA4580EE26A4cD4555563eb8aa1848e",
  destinationBridge: "0xDA6fAe8c3bb26b112d2fC79F061D2cf194A2a3ff",
};

// Mumbai RWA:  0xF4a9cbaC85bB88076531411A9f3Abad1D3bB347c
// binance RWA:  0x580cC8d137eC825cA792447D4B1e7C6c92Fb6FE5
// Mumbai Destination Bridge:  0xD1A880753B91C671661F35d40053892f94e267e2
// binance Destination Bridge:  0xDA6fAe8c3bb26b112d2fC79F061D2cf194A2a3ff
// Mumbai Origin Bridge:  0xF4590b03C50180a64421f2A27f3470947ca26262
// binance Origin Bridge:  0x06A942f30AA4580EE26A4cD4555563eb8aa1848e
