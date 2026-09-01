const API_BASE = (localStorage.getItem('reactanceApi') || '').replace(/\/$/, '');
const $ = id => document.getElementById(id);
let lastState = null;

function normalizeStatus(s){
  const system = s.system || (s.mode === 'OFF' ? 'OFF' : 'ARMED');
  const mode = s.mode || 'OFF';
  return {...s, system, mode, laser:!!s.laser, beam:!!s.beam, alarm:!!s.alarm, events:s.events||[]};
}

function paint(raw){
  const s=normalizeStatus(raw); lastState=s;
  $('systemState').textContent=s.system==='OFF'?'SYSTEM DISARMED':`SYSTEM ${s.mode}`;
  $('systemBadge').textContent=s.system; $('systemBadge').className=`badge ${s.system==='OFF'?'':'active'}`;
  $('stateDetail').textContent=s.system==='OFF'?'Monitoring disabled.':`Alarm profile: ${s.mode}`;
  $('laserStatus').textContent=s.laser?'ACTIVE':'OFF'; $('laserStatus').className=`metric ${s.laser?'active':''}`;
  $('laserBadge').textContent=s.laser?'ACTIVE':'OFF'; $('laserBadge').className=`badge ${s.laser?'active':''}`;
  $('beamStatus').textContent=s.system==='OFF'?'STANDBY':(s.beam?'DETECTED':'BROKEN'); $('beamStatus').className=`metric ${s.beam?'active':''}`;
  $('beamBadge').textContent=s.system==='OFF'?'STANDBY':(s.beam?'DETECTED':'BROKEN'); $('beamBadge').className=`badge ${s.beam?'active':'alert'}`;
  $('alarmStatus').textContent=s.alarm?'TRIGGERED':'STANDBY'; $('alarmStatus').className=`metric ${s.alarm?'alert':''}`;
  $('alarmBadge').textContent=s.alarm?'TRIGGERED':'STANDBY'; $('alarmBadge').className=`badge ${s.alarm?'alert':''}`;
  $('triggerCount').textContent=s.triggers??0; $('activationCount').textContent=s.activations??0; $('deactivationCount').textContent=s.deactivations??0;
  $('uptime').textContent=formatUptime(s.uptime_s ?? s.uptime);
  const events=s.events||[]; $('eventCount').textContent=`${events.length} EVENTS`;
  $('events').innerHTML=events.length?events.slice().reverse().map(e=>`<div class="event"><span class="time">${escapeHtml(e.time||`T+${e.t??0}s`)}</span><span class="type">${escapeHtml(eventName(e.type))}</span><span>${escapeHtml(e.detail||(`value=${e.value??0}`))}</span></div>`).join(''):'<div class="empty">No events loaded.</div>';
  document.querySelectorAll('.cmd').forEach(b=>b.classList.toggle('active',(s.mode==='ARMED_LOUD'&&b.dataset.command==='arm_loud')||(s.mode==='ARMED_SILENT'&&b.dataset.command==='arm_silent')||(s.system==='OFF'&&b.dataset.command==='disarm')));
}
function eventName(n){return ['BOOT','ARM','DISARM','MODE','LASER_ON','LASER_OFF','BEAM_BREAK','BEAM_RESTORE','ALARM_ON','ALARM_OFF'][Number(n)]||`EVENT_${n}`}
function formatUptime(sec){sec=Number(sec)||0;const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=Math.floor(sec%60);return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function escapeHtml(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}
async function api(path,options={}){if(!API_BASE)throw new Error('Set the ESP32 API URL in browser storage: localStorage.setItem("reactanceApi","http://ESP32-IP")');const r=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
async function refresh(){try{const s=await api('/api/status');let events=[];try{events=await api('/api/events')}catch(_){}s.events=events;paint(s);$('connectionDot').className='dot online';$('connectionText').textContent='ESP32 ONLINE';}catch(e){$('connectionDot').className='dot offline';$('connectionText').textContent='ESP32 OFFLINE';$('commandResult').textContent='API OFFLINE // CONFIGURE ESP32 API URL';}}
const paths={arm_loud:'/api/arm/loud',arm_silent:'/api/arm/silent',disarm:'/api/disarm',laser_on:'/api/laser/on',laser_off:'/api/laser/off',silence:'/api/alarm/silence'};
async function command(c){$('commandResult').textContent=`SENDING ${c.toUpperCase()}...`;try{const s=await api(paths[c],{method:'POST'});let events=[];try{events=await api('/api/events')}catch(_){}s.events=events;paint(s);$('commandResult').textContent=`COMMAND ACCEPTED // ${c.toUpperCase()}`;}catch(e){$('commandResult').textContent=`COMMAND FAILED // ${e.message}`;}}
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>command(b.dataset.command)));
function tick(){const d=new Date();$('clock').textContent=d.toLocaleTimeString();$('date').textContent=d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}setInterval(tick,1000);tick();refresh();setInterval(refresh,2500);
