// app.js — connect, chain check, owner gating, meta() read (optional)
import { loadConfigAndAbi, buildProvider, buildReadContract, buildWriteContract } from './config.js';

const els = {
  connectBtn: document.getElementById('connectBtn'),
  status:     document.getElementById('status'),
  acct:       document.getElementById('acct'),
  chainId:    document.getElementById('chainId'),
  netName:    document.getElementById('netName'),
  modeBadge:  document.getElementById('modeBadge'),
  modeText:   document.getElementById('modeText'),
  etherscan:  document.getElementById('etherscanLink'),
  metaCard:   document.getElementById('metaCard'),
  mVersion:   document.getElementById('mVersion'),
  mUiURL:     document.getElementById('mUiURL'),
  mDeployedAt:document.getElementById('mDeployedAt'),
};

let provider, signer, account, config, abi, cRead, cWrite;

init().catch(showError);

async function init() {
  ({ config, abi } = await loadConfigAndAbi());
  els.etherscan.href = config.etherscanUrl;
  els.status.textContent = 'Loaded config & ABI.';

  provider = await buildProvider();
  const net = await provider.getNetwork();
  els.chainId.textContent = Number(net.chainId);
  els.netName.textContent = config.network || '(unknown)';

  cRead = await buildReadContract(provider, config, abi);
  await tryReadMeta(); // hide if not available
}

els.connectBtn.addEventListener('click', connectWallet);

async function connectWallet() {
  try {
    els.status.textContent = 'Connecting wallet…';
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    signer  = await provider.getSigner();
    account = (await signer.getAddress()).toLowerCase();
    els.acct.textContent = account;

    // Chain guard
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== Number(config.chainId)) {
      throw new Error(`Wrong network. Please switch MetaMask to chainId ${config.chainId} (${config.network}).`);
    }

    // Owner gating
    const isOwner = account === String(config.ownerAddress || '').toLowerCase();
    setMode(isOwner);

    // Build write contract
    cWrite = await buildWriteContract(signer, config, abi);

    els.status.innerHTML = `<span class="ok">Wallet connected.</span>`;
    await tryReadMeta();
  } catch (err) {
    showError(err);
  }
}

function setMode(isOwner) {
  els.modeBadge.textContent = isOwner ? 'Owner mode' : 'Viewer mode';
  els.modeBadge.classList.toggle('owner', isOwner);
  els.modeBadge.classList.toggle('viewer', !isOwner);
  els.modeText.textContent = isOwner ? 'Owner' : 'Viewer';
}

async function tryReadMeta() {
  try {
    if (!cRead) return;
    if (typeof cRead.meta !== 'function') { els.metaCard.style.display = 'none'; return; }
    const m = await cRead.meta();
    const version    = m.version    ?? m[0] ?? '';
    const uiURL      = m.uiURL      ?? m[1] ?? '';
    const deployedAt = m.deployedAt ?? m[2] ?? '';
    els.mVersion.textContent    = version    || '(empty)';
    els.mUiURL.textContent      = uiURL      || '(empty)';
    els.mDeployedAt.textContent = deployedAt || '(empty)';
    els.metaCard.style.display  = 'block';
  } catch {
    els.metaCard.style.display = 'none';
  }
}

function showError(err) {
  console.error(err);
  els.status.innerHTML = `<span class="err">${escapeHtml(err.message || String(err))}</span>`;
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[c]));
}
