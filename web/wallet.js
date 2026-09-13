const CONTRACT_ADDRESS = window.PROOFLOOM_CONTRACT_ADDRESS || '0x503E36cf90C6B3Ed888C26f835250A27D0c5d83b';
const CHAIN_ID = 4221;
const RPC_CHAIN = { id: CHAIN_ID, name: 'GenLayer Bradbury Testnet', network: 'genlayer-bradbury', nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } } };
function walletButton() { return document.querySelector('.wallet'); }
function setWallet(address) { if (walletButton()) walletButton().textContent = address ? `◉  ${address.slice(0, 6)}...${address.slice(-4)}` : '◉  Connect wallet'; }
async function connectProofloomWallet() { if (!window.ethereum) throw new Error('Install MetaMask or another EIP-1193 wallet first.'); const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); const address = accounts[0]; const chain = await window.ethereum.request({ method: 'eth_chainId' }); if (parseInt(chain, 16) !== CHAIN_ID) await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: `0x${CHAIN_ID.toString(16)}`, chainName: RPC_CHAIN.name, nativeCurrency: RPC_CHAIN.nativeCurrency, rpcUrls: RPC_CHAIN.rpcUrls.default.http }] }); setWallet(address); return address; }
async function genlayerClient() { if (!CONTRACT_ADDRESS) throw new Error('Configure PROOFLOOM_CONTRACT_ADDRESS after deploying the contract.'); const sdk = await import('https://esm.sh/genlayer-js@1.1.8'); const account = await connectProofloomWallet(); const chain = sdk.testnetBradbury || RPC_CHAIN; const client = sdk.createClient({ chain, account, provider: window.ethereum }); await client.connect('testnetBradbury'); return { client, account, isSuccessful: sdk.isSuccessful }; }
async function waitForSuccessfulTransaction(client, hash, isSuccessful) {
  const transaction = await client.waitForFinalization({ hash });
  const successful = typeof isSuccessful === 'function'
    ? await isSuccessful(transaction)
    : transaction?.status === 'ACCEPTED' || transaction?.status === 'FINALIZED' || transaction?.txStatus === 'ACCEPTED';
  if (!successful) {
    const reason = transaction?.txExecutionResultName || transaction?.status || 'unknown execution result';
    throw new Error(`GenLayer transaction was finalized but not successful (${reason}). Hash: ${hash}`);
  }
  return { ...transaction, hash };
}
async function submitWrite(client, write) {
  // The provider-backed client already owns the connected wallet account.
  // Passing the bare address again is interpreted as an account object by
  // viem and produces "Address undefined is invalid".
  return client.writeContract({
    ...write,
    value: 0n,
    consensusMaxRotations: 1,
    validUntil: BigInt(Math.floor(Date.now() / 1000) + 3600),
  });
}
function bountyArg(id) { if (id === undefined || id === null || String(id).trim() === '' || !/^\d+$/.test(String(id).trim())) throw new Error('Enter a valid bounty number first.'); return BigInt(String(id).trim()); }
window.proofloomReadBounty = async id => { const { client } = await genlayerClient(); return client.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_bounty', args: [bountyArg(id)] }); };
window.proofloomGetStats = async () => { const { client } = await genlayerClient(); return client.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_stats', args: [] }); };
window.proofloomCreateBounty = async (claim, evidenceUrl) => { const { client, isSuccessful } = await genlayerClient(); const write = { address: CONTRACT_ADDRESS, functionName: 'create_bounty', args: [claim, evidenceUrl] }; const hash = await submitWrite(client, write); return waitForSuccessfulTransaction(client, hash, isSuccessful); };
window.proofloomVerifyBounty = async id => { const { client, isSuccessful } = await genlayerClient(); const write = { address: CONTRACT_ADDRESS, functionName: 'verify_bounty', args: [bountyArg(id)] }; const hash = await submitWrite(client, write); return waitForSuccessfulTransaction(client, hash, isSuccessful); };
walletButton()?.addEventListener('click', async () => { try { await connectProofloomWallet(); } catch (error) { window.alert(error.message); } });
if (window.ethereum) {
  window.ethereum.on?.('accountsChanged', accounts => setWallet(accounts?.[0] || ''));
  window.ethereum.on?.('chainChanged', () => { setWallet(''); window.location.reload(); });
  window.ethereum.request({ method: 'eth_accounts' }).then(accounts => { if (accounts?.[0]) setWallet(accounts[0]); }).catch(() => {});
}
