// config.js — loads frozen config & ABI, and builds ethers objects

export const CONFIG_PATH = '../config/contract.json';
export const ABI_PATH    = '../config/abi.json';

export async function loadConfigAndAbi() {
  const [config, abi] = await Promise.all([
    fetch(CONFIG_PATH).then(r => {
      if (!r.ok) throw new Error('Failed to load contract.json');
      return r.json();
    }),
    fetch(ABI_PATH).then(r => {
      if (!r.ok) throw new Error('Failed to load abi.json');
      return r.json();
    })
  ]);
  validateConfig(config);
  return { config, abi };
}

function validateConfig(cfg){
  const required = ['network','chainId','contractAddress','etherscanUrl','ownerAddress','meta'];
  for (const k of required) if (!(k in cfg)) throw new Error(`contract.json missing "${k}"`);
}

export async function buildProvider() {
  if (!window.ethereum) throw new Error('MetaMask not detected');
  return new ethers.BrowserProvider(window.ethereum);
}

export async function buildReadContract(provider, config, abi) {
  return new ethers.Contract(config.contractAddress, abi, provider);
}

export async function buildWriteContract(signer, config, abi) {
  return new ethers.Contract(config.contractAddress, abi, signer);
}
