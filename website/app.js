const API_BASE = localStorage.getItem('reactanceApi') || 'http://REACTANCE-ESP32-IP';
const $ = id => document.getElementById(id);
let fallbackState = {system:'OFF',mode:'NONE',laser:false,beam:false,alarm:false,triggers:0,activations:0,deactivations:0,uptime:0,events:[]};

function paint(s){
  $('systemState').textContent = s.system === 'OFF' ? 'SYSTEM DISARMED' : `SYSTEM ${s.system}`;
  $('systemBadge').textContent = s.system;
  $('systemBadge').className = `badge ${s.system === 'OFF' ? '' : 'active'}`;
  $('stateDetail').textContent = s.mode && s.mode !== 'NONE' ? `Alarm profile: ${s.mode}` : 'Monitoring disabled.';
  $('laserStatus').textContent = s.laser ? 'ACTIVE' : 'OFF'; $('laserStatus').className = `metric ${s.laser?'active':''}`;
  $('laserBadge').textContent = s.laser ? 'ACTIVE':'OFF'; $('laserBadge').className=`badge ${s.laser?'active':''}`;
  $('beamStatus').textContent = s.beam ? 'DETECTED':'BROKEN'; $('beamStatus').className=`metric ${s.beam?'active':''}`;
  $('beamBadge').textContent = s.beam ? 'DETECTED':'BROKEN'; $('beamBadge').className=`badge ${s.beam?'active':'alert'}`;
  $('alarmStatus').textContent = s.alarm ? 'TRIGGERED':'STANDBY'; $('alarmStatus').className=`metric ${s.alarm?'alert':''}`;
  $('alarmBadge').textContent = s.alarm ? 'TRIGGERED':'STANDBY'; $('alarmBadge').className=`badge ${s.alarm?'alert':''}`;
  $('triggerCount').textContent=s.triggers??0; $('activationCount').textContent=s.activations??0; $('deactivationCount').textContent=s.deactivations??0;
  $('uptime').textContent=formatUptime(s.uptime);
  const events=s.events||[]; $('eventCount').textContent=`${events.length} EVENTS`;
  $('events').innerHTML=events.length?events.slice().reverse().map(e=>`<div class="event"><span class="time">${escapeHtml(e.time||'—')}</span><span class="type">${escapeHtml(e.type||'EVENT')}</span><span>${escapeHtml(e.detail||'')}</span></div>`).join(''):'<div class="empty">No events loaded.</div>';
  document.querySelectorAll('.cmd').forEach(b=>b.classList.toggle('active',(s.mode==='LOUD'&&b.dataset.command==='arm_loud')||(s.mode==='SILENT'&&b.dataset.command==='arm_silent')||(s.system==='OFF'&&b.dataset.command==='disarm')));
}
function formatUptime(sec){sec=Number(sec)||0;const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=Math.floor(sec%60);return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function escapeHtml(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}
async function api(path,options={}){const r=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
async function refresh(){try{const s=await api('/api/status');paint(s);$('connectionDot').className='dot online';$('connectionText').textContent='ESP32 ONLINE';}catch(e){paint(fallbackState);$('connectionDot').className='dot offline';$('connectionText').textContent='ESP32 OFFLINE';}}
async function command(c){$('commandResult').textContent=`SENDING ${c.toUpperCase()}...`;try{const s=await api('/api/command',{method:'POST',body:JSON.stringify({command:c})});paint(s);$('commandResult').textContent=`COMMAND ACCEPTED // ${c.toUpperCase()}`;}catch(e){$('commandResult').textContent=`COMMAND FAILED // ${e.message}`;}}
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.command)));
function tick(){const d=new Date();$('clock').textContent=d.toLocaleTimeString();$('date').textContent=d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}setInterval(tick,1000);tick();refresh();setInterval(refresh,2500);
