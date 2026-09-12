const bounties = [
  { id: 'V-0421', status: 'open', sector: 'CLIMATE', title: 'Prove that the Riau canopy restoration crossed 500 hectares.', team: 'Earthline / 4 sources required', reward: '2,400', people: ['E', 'L', 'J'] },
  { id: 'V-0419', status: 'verifying', sector: 'OPEN SOURCE', title: 'Confirm this dependency has no critical vulnerability.', team: 'Aperture Labs / verification in progress', reward: '850', people: ['A', 'M'] },
  { id: 'V-0414', status: 'open', sector: 'PUBLIC GOOD', title: 'Show that 10,000 households received clean water access.', team: 'Clearwell / 3 sources required', reward: '1,800', people: ['C', 'R', 'N'] },
  { id: 'V-0408', status: 'final', sector: 'GOVERNANCE', title: 'Verify the city published its complete procurement data.', team: 'Open Ward / settled 2 hours ago', reward: '600', people: ['O', 'W'] },
  { id: 'V-0402', status: 'verifying', sector: 'RESEARCH', title: 'Validate the public benchmark reproduces reported results.', team: 'Lab Note / 5 validators reading', reward: '1,050', people: ['L', 'S', 'P'] },
  { id: 'V-0398', status: 'open', sector: 'PRODUCT', title: 'Prove the accessibility release meets WCAG AA.', team: 'Kindred / 2 sources required', reward: '720', people: ['K', 'T'] }
];
const cards = document.querySelector('#cards'); const search = document.querySelector('#search'); let current = 'all';
function render() { const q = search.value.toLowerCase(); cards.innerHTML = bounties.filter(x => (current === 'all' || x.status === current) && `${x.title} ${x.sector} ${x.team}`.toLowerCase().includes(q)).map(x => `<article class="card"><div class="card-top"><span>${x.id} · ${x.sector}</span><span class="tag ${x.status}">${x.status === 'open' ? 'OPEN' : x.status === 'verifying' ? 'VERIFYING' : 'FINAL'}</span></div><h3>${x.title}</h3><p>${x.team}</p><div class="card-bottom"><div class="reward">${x.reward} <small>GEN</small></div><div class="avatars">${x.people.map(p=>`<i>${p}</i>`).join('')}</div></div></article>`).join(''); }
search.addEventListener('input', render); document.querySelector('#tabs').addEventListener('click', e => { if (!e.target.dataset.filter) return; current = e.target.dataset.filter; document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('selected', x === e.target)); render(); }); render();
const dialog = document.querySelector('#createDialog'); document.querySelector('#openCreate').onclick = () => dialog.showModal(); document.querySelector('#scrollDiscover').onclick = () => document.querySelector('#discover').scrollIntoView(); document.querySelector('#createBounty').onclick = e => { e.preventDefault(); dialog.close(); const toast = document.querySelector('#toast'); toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 3400); }; document.addEventListener('keydown', e => { if(e.key === 'Escape') dialog.close(); });
document.querySelectorAll('.brand').forEach(brand => { brand.lastChild.textContent = 'PROOFLOOM'; });
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }), { threshold: .15 });
document.querySelectorAll('.card, .steps article, .proof-copy, .ledger').forEach((el, i) => { el.style.setProperty('--delay', `${i * 70}ms`); revealObserver.observe(el); });
window.addEventListener('pointermove', event => { document.documentElement.style.setProperty('--mx', `${event.clientX / window.innerWidth * 100}%`); document.documentElement.style.setProperty('--my', `${event.clientY / window.innerHeight * 100}%`); });
const nav = document.querySelector('nav');
const sectionLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];
window.addEventListener('scroll', () => { nav?.classList.toggle('is-scrolled', window.scrollY > 24); }, { passive: true });
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) sectionLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
const contractConfig = document.createElement('script'); contractConfig.src = 'contract-config.js'; document.head.append(contractConfig);
const walletModule = document.createElement('script'); walletModule.type = 'module'; walletModule.src = 'wallet.js'; document.body.append(walletModule);
const createForm = document.querySelector('#createDialog form');
const createButton = document.querySelector('#createBounty');
const originalCreate = createButton?.onclick;
if (createButton && createForm) createButton.onclick = async event => {
  event.preventDefault();
  const fields = createForm.querySelectorAll('input');
  const claim = fields[0]?.value.trim();
  const evidenceUrl = fields[3]?.value.trim();
  if (!claim || !/^https:\/\//i.test(evidenceUrl)) { window.alert('Add a claim and an HTTPS evidence URL.'); return; }
  createButton.disabled = true; createButton.textContent = 'Signing + waiting for consensus…';
  try {
    const receipt = await window.proofloomCreateBounty(claim, evidenceUrl);
    const history = JSON.parse(localStorage.getItem('proofloom_activity') || '[]'); history.unshift({ claim, evidenceUrl, tx: receipt?.transactionHash || '', at: new Date().toISOString() }); localStorage.setItem('proofloom_activity', JSON.stringify(history.slice(0, 20)));
    createForm.closest('dialog').close();
    const toast = document.querySelector('#toast');
    toast.textContent = `Bounty finalized on Bradbury · ${receipt?.transactionHash || 'view wallet activity'}`;
    toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 6000);
  } catch (error) { window.alert(error.message || 'Transaction failed.'); }
  finally { createButton.disabled = false; createButton.innerHTML = 'Lock terms & create <b>↗</b>'; }
};
const livePanel = document.createElement('div');
livePanel.className = 'live-panel'; livePanel.innerHTML = '<div><span class="index">ON-CHAIN LOOKUP</span><strong>Inspect a real bounty</strong><small>Read Bradbury state or trigger consensus verification.</small></div><div class="live-actions"><input id="bountyId" type="number" min="1" placeholder="Bounty #"/><button id="readBounty" class="ghost">Read state</button><button id="verifyBounty" class="primary">Verify evidence ↗</button></div><pre id="bountyResult">No lookup yet.</pre>';
document.querySelector('.market-tools')?.after(livePanel);
const bountyId = document.querySelector('#bountyId'); const bountyResult = document.querySelector('#bountyResult');
document.querySelector('#readBounty')?.addEventListener('click', async () => { try { bountyResult.textContent = JSON.stringify(await window.proofloomReadBounty(bountyId.value), null, 2); } catch (error) { bountyResult.textContent = error.message; } });
document.querySelector('#verifyBounty')?.addEventListener('click', async () => { try { bountyResult.textContent = 'Consensus transaction submitted…'; const receipt = await window.proofloomVerifyBounty(bountyId.value); bountyResult.textContent = `Finalized: ${receipt?.transactionHash || 'success'}`; } catch (error) { bountyResult.textContent = error.message; } });
const statsBar = document.createElement('section'); statsBar.className = 'stats-bar'; statsBar.innerHTML = '<div><span>NETWORK</span><strong><i></i> BRADBURY 4221</strong></div><div><span>CONTRACT</span><strong>0x503E…D83b</strong></div><div><span>ON-CHAIN BOUNTIES</span><strong id="liveTotal">—</strong></div><div><span>APPROVED</span><strong id="liveApproved">—</strong></div><button class="ghost" id="refreshStats">Refresh ↻</button>';
document.querySelector('.hero')?.after(statsBar);
async function refreshLiveStats() { const total = document.querySelector('#liveTotal'); const approved = document.querySelector('#liveApproved'); try { const data = await window.proofloomGetStats(); total.textContent = data.total ?? data[0] ?? '0'; approved.textContent = data.approved ?? data[1] ?? '0'; statsBar.classList.add('loaded'); } catch { total.textContent = 'Connect'; approved.textContent = 'wallet'; } }
document.querySelector('#refreshStats')?.addEventListener('click', refreshLiveStats);
setTimeout(refreshLiveStats, 900);
