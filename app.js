const DEFAULT_AIRPORTS = [
  {code:'DEL', name:'Delhi'}, {code:'BOM', name:'Mumbai'},
  {code:'HYD', name:'Hyderabad'}, {code:'BLR', name:'Bengaluru'},
  {code:'GOI', name:'Goa'}
];
const DEFAULT_FLIGHTS = [['DEL','BOM'],['BOM','HYD'],['HYD','BLR'],['GOI','DEL']];
let airports = structuredClone(DEFAULT_AIRPORTS);
let flights = DEFAULT_FLIGHTS.map(([from,to])=>({from,to}));
let toastTimer;

const $ = id => document.getElementById(id);
const codeOf = code => airports.find(a=>a.code===code);
const matrix = () => {
  const n=airports.length, idx=Object.fromEntries(airports.map((a,i)=>[a.code,i]));
  const direct=Array.from({length:n},()=>Array(n).fill(0));
  flights.forEach(f=>{if(idx[f.from]!==undefined&&idx[f.to]!==undefined) direct[idx[f.from]][idx[f.to]]=1;});
  const reach=direct.map(row=>row.slice());
  // Warshall: k must be the outermost loop.
  for(let k=0;k<n;k++) for(let i=0;i<n;i++) for(let j=0;j<n;j++)
    reach[i][j]=reach[i][j] || (reach[i][k] && reach[k][j]) ? 1 : 0;
  return {direct,reach};
};
function showToast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function optionsHTML(selected){return airports.map(a=>`<option value="${a.code}" ${a.code===selected?'selected':''}>${a.name} (${a.code})</option>`).join('')}
function fillSelect(id, preferred){const el=$(id);if(!el)return;const old=preferred||el.value;el.innerHTML=optionsHTML(airports.some(a=>a.code===old)?old:airports[0]?.code);el.disabled=airports.length===0}
function fillAllSelects(){
  ['quickFrom','quickTo','flightFrom','flightTo','checkFrom','checkTo'].forEach(id=>fillSelect(id));
  if($('quickFrom')&&airports.length>1&&$('quickFrom').value===$('quickTo').value)$('quickTo').value=airports[1].code;
  if($('checkFrom')&&airports.length>1&&$('checkFrom').value===$('checkTo').value)$('checkTo').value=airports[1].code;
}
function renderStats(){
  const {reach}=matrix(); const count=reach.reduce((sum,row)=>sum+row.reduce((s,v)=>s+v,0),0);
  $('airportCount').textContent=airports.length;$('flightCount').textContent=flights.length;$('reachableCount').textContent=count;
  $('networkBadge').textContent=`${airports.length} NODES`;
}
function renderNetwork(targetId){
  const el=$(targetId); if(!el)return;
  const w=el.clientWidth||500,h=el.clientHeight||250;
  el.innerHTML='';
  if(!airports.length){el.innerHTML='<div style="padding:30px;color:#8a96a9">Add an airport to begin.</div>';return}
  const n=airports.length, cx=w/2, cy=h/2, rx=Math.max(50,w*.36), ry=Math.max(38,h*.34);
  const positions=airports.map((a,i)=>{const angle=(-Math.PI/2)+(2*Math.PI*i/n);return {x:cx+rx*Math.cos(angle),y:cy+ry*Math.sin(angle),a}});
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');
  const defs=document.createElementNS(svgNS,'defs'), marker=document.createElementNS(svgNS,'marker');
  marker.setAttribute('id',`arrow-${targetId}`);marker.setAttribute('markerWidth','7');marker.setAttribute('markerHeight','7');marker.setAttribute('refX','5');marker.setAttribute('refY','3');marker.setAttribute('orient','auto');
  const p=document.createElementNS(svgNS,'path');p.setAttribute('d','M0,0 L6,3 L0,6 Z');p.setAttribute('fill','#6d92df');marker.appendChild(p);defs.appendChild(marker);svg.appendChild(defs);
  flights.forEach(f=>{const from=positions.find(p=>p.a.code===f.from),to=positions.find(p=>p.a.code===f.to);if(!from||!to)return;
    const line=document.createElementNS(svgNS,'line');line.setAttribute('x1',from.x);line.setAttribute('y1',from.y);line.setAttribute('x2',to.x);line.setAttribute('y2',to.y);line.setAttribute('marker-end',`url(#arrow-${targetId})`);
    if(f.from===f.to){line.setAttribute('x1',from.x-12);line.setAttribute('x2',from.x+12);line.setAttribute('y1',from.y-15);line.setAttribute('y2',from.y-15)}
    svg.appendChild(line);
  });
  el.appendChild(svg);
  positions.forEach(({x,y,a})=>{const node=document.createElement('div');node.className='node';node.style.left=`${x/w*100}%`;node.style.top=`${y/h*100}%`;
    node.innerHTML=`<div class="node-dot">${escapeHTML(a.code)}</div><div class="node-name">${escapeHTML(a.name)}</div>`;el.appendChild(node)});
}
function renderFlights(){
  const list=$('flightList');
  if(!flights.length){list.innerHTML='<div class="flight-item" style="color:#929daf">No direct flights added yet.</div>';return}
  list.innerHTML=flights.map((f,i)=>`<div class="flight-item"><div><b>${escapeHTML(f.from)}</b><span>→</span><b>${escapeHTML(f.to)}</b><span style="margin-left:8px">${escapeHTML(codeOf(f.from)?.name||'')} → ${escapeHTML(codeOf(f.to)?.name||'')}</span></div><button class="delete" data-delete-flight="${i}" title="Remove flight">×</button></div>`).join('');
}
function renderAirports(){
  $('airportList').innerHTML=airports.map(a=>`<div class="airport-chip"><span class="airport-code">${escapeHTML(a.code)}</span><b>${escapeHTML(a.name)}</b><button data-delete-airport="${a.code}" title="Remove airport">×</button></div>`).join('')||'<span style="font-size:11px;color:#8a96a9">No airports yet. Add one to start.</span>';
}
function renderMatrix(targetId,data,isClosure){
  const el=$(targetId);if(!airports.length){el.innerHTML='<p style="font-size:11px;color:#8994a8">Add airports to show the matrix.</p>';return}
  let html='<table><thead><tr><th>FROM / TO</th>'+airports.map(a=>`<th title="${escapeHTML(a.name)}">${escapeHTML(a.code)}</th>`).join('')+'</tr></thead><tbody>';
  data.forEach((row,i)=>{html+=`<tr><th title="${escapeHTML(airports[i].name)}">${escapeHTML(airports[i].code)}</th>`+row.map(v=>`<td class="${v?(isClosure?'reachable':'one'):''}">${v}</td>`).join('')+'</tr>'});
  el.innerHTML=html+'</tbody></table>';
}
function renderMatrices(){const {direct,reach}=matrix();renderMatrix('adjMatrix',direct,false);renderMatrix('reachMatrix',reach,true)}
function renderAll(){
  fillAllSelects();renderStats();renderNetwork('miniNetwork');renderNetwork('fullNetwork');renderFlights();renderAirports();renderMatrices();
}
function findPath(from,to){
  // Use the reachability matrix for the yes/no answer; BFS only reconstructs a sample itinerary.
  const ix=airports.findIndex(a=>a.code===from), jx=airports.findIndex(a=>a.code===to);
  if(ix<0||jx<0||!matrix().reach[ix][jx])return null;
  const queue=[[from]], visited=new Set([from]);
  while(queue.length){const path=queue.shift(),last=path[path.length-1];if(last===to)return path;
    flights.filter(f=>f.from===last).forEach(f=>{if(!visited.has(f.to)){visited.add(f.to);queue.push([...path,f.to])}});
  }
  return null;
}
function routeDescription(from,to,containerId){
  const result=$(containerId), fromAirport=codeOf(from), toAirport=codeOf(to);
  if(!fromAirport||!toAirport){result.className='route-result no';result.innerHTML='<div class="empty-icon">!</div><div><b>No airports available</b><p>Add airports to check connectivity.</p></div>';return}
  const idxFrom=airports.findIndex(a=>a.code===from),idxTo=airports.findIndex(a=>a.code===to),canReach=!!matrix().reach[idxFrom]?.[idxTo];
  if(canReach){
    const path=findPath(from,to)||[from,to], stops=path.map((code,i)=>`<span class="route-stop">${escapeHTML(code)}<br><small>${escapeHTML(codeOf(code)?.name||'')}</small></span>${i<path.length-1?'<span class="route-arrow">→</span>':''}`).join('');
    const layovers=Math.max(0,path.length-2);
    result.className='route-result yes';result.innerHTML=`<div class="empty-icon">✓</div><div><b>Route available</b><p>${escapeHTML(fromAirport.name)} to ${escapeHTML(toAirport.name)} is reachable ${layovers===0?'with a direct flight':`with ${layovers} layover${layovers===1?'':'s'}`}.</p><div class="route-chain">${stops}</div></div>`;
  }else{
    result.className='route-result no';result.innerHTML=`<div class="empty-icon">×</div><div><b>No route available</b><p>No directed path exists from ${escapeHTML(fromAirport.name)} (${from}) to ${escapeHTML(toAirport.name)} (${to}) in the current network.</p></div>`;
  }
}
function quickRoute(){
  const from=$('quickFrom').value,to=$('quickTo').value;
  const el=$('quickResult');if(!from||!to){el.className='result-box fail';el.textContent='Please add at least one airport.';return}
  if(from===to){const ix=airports.findIndex(a=>a.code===from);const cycle=!!matrix().reach[ix]?.[ix];el.className='result-box '+(cycle?'success':'fail');el.textContent=cycle?'A directed cycle exists, so this airport can be revisited.':'No non-empty route returns to the same airport.';return}
  const can=!!matrix().reach[airports.findIndex(a=>a.code===from)]?.[airports.findIndex(a=>a.code===to)];
  el.className='result-box '+(can?'success':'fail');el.textContent=can?`✓ Route available: ${findPath(from,to).join(' → ')}`:'✕ No route available for this direction.';
}
function openModal(){$('airportModal').classList.add('open');$('newName').focus()}
function closeModal(){$('airportModal').classList.remove('open');$('formError').textContent='';$('airportForm').reset()}
function goTo(tab){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active-page',p.id===tab));
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  const titles={overview:['OVERVIEW','Flight Connectivity Dashboard'],network:['FLIGHT NETWORK','Airport Network Management'],matrices:['MATRICES','Connectivity Matrices'],checker:['ROUTE CHECKER','Route Connectivity Checker']};
  $('crumb').textContent=titles[tab][0];$('pageTitle').textContent=titles[tab][1];
  if(tab==='network'){renderNetwork('fullNetwork')}window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.goto)));
$('quickCheck').addEventListener('click',quickRoute);
$('checkRoute').addEventListener('click',()=>routeDescription($('checkFrom').value,$('checkTo').value,'routeResult'));
$('swapBtn').addEventListener('click',()=>{const a=$('checkFrom').value;$('checkFrom').value=$('checkTo').value;$('checkTo').value=a;});
$('flightForm').addEventListener('submit',e=>{e.preventDefault();const from=$('flightFrom').value,to=$('flightTo').value;if(!from||!to){showToast('Add airports before creating a flight.');return}if(from===to){showToast('Choose two different airports for this flight.');return}if(flights.some(f=>f.from===from&&f.to===to)){showToast('That direct flight already exists.');return}flights.push({from,to});renderAll();showToast(`Added direct flight ${from} → ${to}.`)});
$('flightList').addEventListener('click',e=>{const btn=e.target.closest('[data-delete-flight]');if(!btn)return;const f=flights.splice(Number(btn.dataset.deleteFlight),1)[0];renderAll();showToast(`Removed ${f.from} → ${f.to}.`)});
$('airportList').addEventListener('click',e=>{const btn=e.target.closest('[data-delete-airport]');if(!btn)return;const code=btn.dataset.deleteAirport;airports=airports.filter(a=>a.code!==code);flights=flights.filter(f=>f.from!==code&&f.to!==code);renderAll();showToast(`Removed ${code} and its connected flights.`)});
$('addAirportBtn').addEventListener('click',openModal);$('closeModal').addEventListener('click',closeModal);$('cancelModal').addEventListener('click',closeModal);
$('airportModal').addEventListener('click',e=>{if(e.target===$('airportModal'))closeModal()});
$('airportForm').addEventListener('submit',e=>{e.preventDefault();const name=$('newName').value.trim(),code=$('newCode').value.trim().toUpperCase();if(!/^[A-Z]{2,5}$/.test(code)){$('formError').textContent='Code must contain 2–5 letters.';return}if(airports.some(a=>a.code===code)){$('formError').textContent='That airport code already exists.';return}airports.push({name,code});renderAll();closeModal();showToast(`Added ${name} (${code}).`)});
$('recomputeBtn').addEventListener('click',()=>{renderMatrices();renderStats();showToast('Reachability matrix recomputed using Warshall’s algorithm.')});
$('resetBtn').addEventListener('click',()=>{airports=structuredClone(DEFAULT_AIRPORTS);flights=DEFAULT_FLIGHTS.map(([from,to])=>({from,to}));renderAll();goTo('overview');showToast('Demo network restored.')});
window.addEventListener('resize',()=>{renderNetwork('miniNetwork');if($('network').classList.contains('active-page'))renderNetwork('fullNetwork')});
renderAll();
