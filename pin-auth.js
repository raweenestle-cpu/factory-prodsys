// ── PIN AUTH MODULE — PROD.SYS ────────────────────────────────
// import แล้วเรียก initPinAuth() ที่ทุกหน้า
// ใช้: window.requirePin(allowedPositions, callback)

import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {getFirestore,collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB_CONFIG={
  apiKey:"AIzaSyC3f6jMuhugE6BNfRfkpOA9BMrIKWR9YgQ",
  authDomain:"production-filling.firebaseapp.com",
  projectId:"production-filling",
  storageBucket:"production-filling.firebasestorage.app",
  messagingSenderId:"89098393458",
  appId:"1:89098393458:web:b723f2886e8a341935afeb"
};
const app=getApps().length?getApps()[0]:initializeApp(FB_CONFIG);
const db=getFirestore(app);

// ── hash PIN ─────────────────────────────────────────────────
async function hashPin(pin){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('PRODSYS:'+pin));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ── inject modal HTML ─────────────────────────────────────────
function injectModal(){
  if(document.getElementById('pin-auth-modal'))return;
  const modal=document.createElement('div');
  modal.id='pin-auth-modal';
  modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
  modal.innerHTML=`
<div style="background:#111318;border:1px solid #2a2f3a;border-radius:20px;padding:24px 20px;width:100%;max-width:320px;margin:16px">
  <div style="text-align:center;margin-bottom:16px">
    <div style="font-size:28px;margin-bottom:6px">🔐</div>
    <div id="pin-auth-title" style="font-family:'DM Mono',monospace;font-size:14px;font-weight:900;color:#f0f2f5;margin-bottom:3px">ยืนยันตัวตน</div>
    <div id="pin-auth-sub" style="font-family:'DM Mono',monospace;font-size:10px;color:#5a6270">กรอกรหัส PIN 4 หลัก</div>
  </div>
  <!-- Employee selector -->
  <div style="margin-bottom:12px">
    <select id="pin-emp-sel" style="width:100%;background:#1a1d24;border:1px solid #2a2f3a;border-radius:8px;color:#f0f2f5;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;padding:9px 12px;outline:none;cursor:pointer">
      <option value="">— เลือกชื่อ —</option>
    </select>
  </div>
  <!-- PIN display -->
  <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px" id="pin-dots">
    <div id="pind0" style="width:16px;height:16px;border-radius:50%;border:2px solid #3a4050;background:transparent;transition:all .2s"></div>
    <div id="pind1" style="width:16px;height:16px;border-radius:50%;border:2px solid #3a4050;background:transparent;transition:all .2s"></div>
    <div id="pind2" style="width:16px;height:16px;border-radius:50%;border:2px solid #3a4050;background:transparent;transition:all .2s"></div>
    <div id="pind3" style="width:16px;height:16px;border-radius:50%;border:2px solid #3a4050;background:transparent;transition:all .2s"></div>
  </div>
  <!-- Error -->
  <div id="pin-error" style="font-family:'DM Mono',monospace;font-size:11px;color:#f04f5e;text-align:center;min-height:16px;margin-bottom:8px"></div>
  <!-- Keypad -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px" id="pin-keypad">
    ${[1,2,3,4,5,6,7,8,9,'','0','⌫'].map(k=>`
    <button onclick="window._pinKey('${k}')" style="background:#1a1d24;border:1px solid #2a2f3a;border-radius:10px;height:52px;font-family:'DM Mono',monospace;font-size:${k==='⌫'?'14':'18'}px;font-weight:700;color:${k===''?'transparent':'#f0f2f5'};cursor:${k===''?'default':'pointer'};transition:all .15s" ${k===''?'disabled':''}>
      ${k}
    </button>`).join('')}
  </div>
  <button onclick="window._pinCancel()" style="width:100%;padding:11px;border-radius:10px;border:1px solid #2a2f3a;background:transparent;color:#5a6270;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;cursor:pointer">ยกเลิก</button>
</div>`;
  document.body.appendChild(modal);
}

// ── state ─────────────────────────────────────────────────────
let _pinValue='';
let _pinCallback=null;
let _allowedPositions=[];
let _employees=[];
let _loaded=false;

async function loadEmployees(){
  if(_loaded)return;
  const snap=await getDocs(collection(db,'employees'));
  _employees=snap.docs.map(d=>({id:d.id,...d.data()}));
  _loaded=true;
}

// ── public API ────────────────────────────────────────────────
window.requirePin=async function(positions=[],callback){
  injectModal();
  await loadEmployees();
  _allowedPositions=positions;
  _pinCallback=callback;
  _pinValue='';
  updateDots();
  document.getElementById('pin-error').textContent='';
  // populate employee selector
  const sel=document.getElementById('pin-emp-sel');
  const filtered=positions.length
    ?_employees.filter(e=>positions.includes(e.position)&&e.active!==false)
    :_employees.filter(e=>e.active!==false);
  sel.innerHTML='<option value="">— เลือกชื่อ —</option>'+
    filtered.map(e=>`<option value="${e.id}">${e.name} (${e.position})</option>`).join('');
  // title
  if(positions.length){
    document.getElementById('pin-auth-sub').textContent='ตำแหน่งที่อนุญาต: '+positions.join(', ');
  } else {
    document.getElementById('pin-auth-sub').textContent='กรอกรหัส PIN 4 หลัก';
  }
  document.getElementById('pin-auth-modal').style.display='flex';
};

window._pinKey=function(k){
  if(k==='⌫'){_pinValue=_pinValue.slice(0,-1);updateDots();return;}
  if(k===''||_pinValue.length>=4)return;
  _pinValue+=k;
  updateDots();
  if(_pinValue.length===4) setTimeout(verifyPin,150);
};

window._pinCancel=function(){
  document.getElementById('pin-auth-modal').style.display='none';
  _pinValue='';_pinCallback=null;
};

function updateDots(){
  for(let i=0;i<4;i++){
    const d=document.getElementById('pind'+i);
    if(d){
      d.style.background=i<_pinValue.length?'#00d4ff':'transparent';
      d.style.borderColor=i<_pinValue.length?'#00d4ff':'#3a4050';
    }
  }
}

async function verifyPin(){
  const empId=document.getElementById('pin-emp-sel').value;
  const errEl=document.getElementById('pin-error');
  if(!empId){errEl.textContent='กรุณาเลือกชื่อก่อน';_pinValue='';updateDots();return;}
  const emp=_employees.find(e=>e.id===empId);
  if(!emp){errEl.textContent='ไม่พบพนักงาน';_pinValue='';updateDots();return;}
  // ตรวจสอบ position
  if(_allowedPositions.length&&!_allowedPositions.includes(emp.position)){
    errEl.textContent='ตำแหน่งไม่มีสิทธิ์';_pinValue='';updateDots();return;
  }
  // admin bypass
  const isAdmin=emp.position==='admin';
  // verify PIN
  const inputHash=await hashPin(_pinValue);
  if(!isAdmin&&emp.pin_hash!==inputHash){
    errEl.textContent='PIN ไม่ถูกต้อง';
    // shake animation
    const modal=document.getElementById('pin-dots');
    if(modal){modal.style.animation='none';setTimeout(()=>{modal.style.animation='pinShake .3s ease';},10);}
    _pinValue='';updateDots();
    return;
  }
  // success
  document.getElementById('pin-auth-modal').style.display='none';
  // expose employee info
  window._empName=emp.name;
  window._empId=emp.emp_id||emp.id;
  window._empPosition=emp.position;
  window._empSig=emp.signature||'';
  window._empDoc=emp;
  _pinValue='';
  if(_pinCallback)_pinCallback(emp);
}

// ── inject keyframe ───────────────────────────────────────────
const style=document.createElement('style');
style.textContent='@keyframes pinShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}';
document.head.appendChild(style);

export {hashPin,loadEmployees};
