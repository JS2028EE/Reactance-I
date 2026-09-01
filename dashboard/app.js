const API = localStorage.getItem('reactanceApi') || '';
const typeNames={0:'BOOT',1:'SYSTEM ARMED',2:'SYSTEM DISARMED',3:'MODE CHANGE',4:'LASER ON',5:'LASER OFF',6:'BEAM INTERRUPTION',7:'BEAM RESTORED',8:'ALARM ACTIVE',9:'ALARM CLEARED'};
const $=id=>document.getElementById(id);
function fmt(sec){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return [h,m,s].map((x,i)=>i===0?String(x).padStart(2,'0'):String(x).padStart(2,'0')).join(':')}
function render(d){
 $('connection').textContent='● LINK ONLINE';$('connection').className='pill good';
 const armed=d.mode!=='OFF'; $('mode').textContent=d.mode.replace('_',' / '); $('systemValue').textContent=armed?'ARMED':'DISARMED'; $('systemSub').textContent=d.mode;
 $('laserValue').textContent=d.laser?'ACTIVE':'OFF'; $('beamValue').textContent=d.beam?'DETECTED':'INTERRUPTED'; $('alarmValue').textContent=d.alarm?'ACTIVE':'QUIET'; $('triggerValue').textContent=d.triggers; $('uptimeValue').textContent=fmt(d.uptime_s);
 document.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
 const a=d.mode==='ARMED_LOUD'?document.querySelector('.loud'):d.mode==='ARMED_SILENT'?document.querySelector('.silent'):null;if(a)a.classList.add('active');
}
async function call(path){try{const r=await fetch(API+path,{method:'GET'});if(!r.ok)throw Error(r.status);render(await r.json());await refreshEvents()}catch(e){$('connection').textContent='● LINK OFFLINE';$('connection').className='pill bad';console.error(e)}}
async function refresh(){try{const r=await fetch(API+'/api/status');render(await r.json());await refreshEvents()}catch(e){$('connection').textContent='● LINK OFFLINE';$('connection').className='pill bad'}}
async function refreshEvents(){try{const r=await fetch(API+'/api/events');const list=await r.json();$('eventCount').textContent=`${list.length} EVENTS`;$('events').innerHTML=list.length?list.slice().reverse().map(e=>`<div class="event"><span>T+${fmt(e.t)}</span><strong>${typeNames[e.type]||'EVENT'}</strong><span>${e.value}</span></div>`).join(''):'<div class="empty">NO EVENTS RECEIVED</div>'}catch(e){}}
document.querySelectorAll('button[data-action]').forEach(b=>b.addEventListener('click',()=>call(b.dataset.action)));
setInterval(()=>{$('clock').textContent=new Date().toLocaleTimeString()},1000);setInterval(refresh,1000);refresh();