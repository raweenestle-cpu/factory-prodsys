// PROD.SYS shared.js — updated 2026-06-02 23:57
// shared.js — status functions ใช้ร่วมกันทุกหน้า
export function resolveStatus(row){
  var s=row&&row.status||'pending';
  if(s==='pasteurising'&&!row.past_start_time) return 'waiting_past';
  return s;
}
export function statusLabel(s){
  if(s==='pending') return 'Pending';
  if(s==='mixing') return 'Mixing';
  if(s==='waiting_past') return 'Waiting Past.';
  if(s==='pasteurising') return 'Pasteurising';
  if(s==='past_done') return 'Past. Done';
  if(s==='ready') return 'Ready';
  if(s==='sent_filling') return 'Sent Filling';
  if(s==='filling') return 'Filling';
  if(s==='curing') return 'Curing';
  if(s==='empty') return 'Empty';
  if(s==='cleaned') return 'Cleaned';
  return s||'';
}
export function statusColor(s){
  if(s==='pending') return '#6b7280';
  if(s==='mixing') return '#fbbf24';
  if(s==='waiting_past') return '#60a5fa';
  if(s==='pasteurising') return '#3b82f6';
  if(s==='past_done') return '#22c55e';
  if(s==='ready') return '#4ade80';
  if(s==='sent_filling') return '#c084fc';
  if(s==='filling') return '#22c55e';
  if(s==='curing') return '#f97316';
  if(s==='empty') return '#eab308';
  if(s==='cleaned') return '#e5e7eb';
  return '#6b7280';
}
export function statusBlink(s){
  return s==='mixing'||s==='waiting_past'||s==='pasteurising'||s==='past_done'||s==='ready'||s==='sent_filling'||s==='filling'||s==='curing';
}
export function statusBadge(s){
  var lbl=statusLabel(s),col=statusColor(s),blk=statusBlink(s);
  return '<span class="'+(blk?'status-blink':'')+'" style="display:inline-block;font-family:DM Mono,monospace;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+col+'22;color:'+col+';border:1px solid '+col+'55;white-space:nowrap">'+lbl+'</span>';
}

// ══ EXPIRE BOX ═══════════════════════════════════════════════════════
// ใช้ร่วมกันทุกหน้า — filling, aging, cipman, mixing, pasteurize
export function expireBox(expireAt){
  if(!expireAt) return '';
  var ed=new Date(expireAt);
  var now=new Date();
  var rh=(ed-now)/3600000;
  var isExp=rh<0;
  var isCrit=!isExp&&rh<24;
  var isWarn=!isExp&&rh<48;
  var bg=isExp?'rgba(185,28,28,.12)':isCrit?'rgba(185,28,28,.08)':isWarn?'rgba(194,65,12,.08)':'rgba(21,128,61,.08)';
  var bc=isExp?'#b91c1c':isCrit?'#b91c1c':isWarn?'#c2410c':'#15803d';
  var ic=isExp?'❌':isCrit?'⚠️':isWarn?'🟡':'✅';
  var dateStr=ed.toLocaleDateString('th-TH',{weekday:'short',day:'2-digit',month:'short'});
  var timeStr=ed.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  var remStr=isExp?'หมดอายุแล้ว':rh<1?Math.round(rh*60)+' นาที':rh<24?rh.toFixed(1)+' ชม.':Math.floor(rh/24)+' วัน '+Math.round(rh%24)+' ชม.';
  return '<div style="background:'+bg+';border:2px solid '+bc+';border-radius:8px;padding:6px 10px;margin-top:6px;font-family:DM Mono,monospace">'
    +'<div style="font-size:10px;font-weight:800;color:'+bc+';letter-spacing:.06em">'+ic+' วันหมดอายุ</div>'
    +'<div style="font-size:13px;font-weight:900;color:'+bc+';margin-top:2px">'+dateStr+' '+timeStr+'</div>'
    +'<div style="font-size:10px;font-weight:700;color:'+bc+';opacity:.8;margin-top:1px">เหลือ '+remStr+'</div>'
    +'</div>';
}

// ══ CALC EXPIRE AT ════════════════════════════════════════════════════
// คำนวณวันหมดอายุจาก past_end_time + aging_time (ชั่วโมง)
// pastEndStr = "HH:MM:SS", dateStr = "YYYY-MM-DD", agingHr = number
export function calcExpireAt(pastEndStr, dateStr, agingHr){
  if(!pastEndStr||!dateStr||!agingHr) return null;
  try{
    var parts=pastEndStr.split(':').map(Number);
    var base=new Date(dateStr+'T'+
      String(parts[0]||0).padStart(2,'0')+':'+
      String(parts[1]||0).padStart(2,'0')+':'+
      String(parts[2]||0).padStart(2,'0'));
    if(isNaN(base)) return null;
    return new Date(base.getTime()+agingHr*3600000).toISOString();
  }catch(e){ return null; }
}

// ══ VOLUME DISPLAY ════════════════════════════════════════════════════
// แสดง current_vol ถ้ามี ไม่งั้นใช้ volume_liter
export function displayVol(row){
  var v=row&&row.current_vol!=null?+row.current_vol:+(row&&row.volume_liter||0);
  return Math.round(v).toLocaleString()+' L';
}

// ══ PRODUCT COLOR ═════════════════════════════════════════════════════
// ดึงสีจาก productMap โดย mix_code — ถ้าไม่มีใช้ default
export function getProductColor(productMap, mixCode){
  var p=productMap&&productMap[mixCode];
  return (p&&p.color)||'#3b82f6';
}

// ══ TEMPERATURE ══════════════════════════════════════════════════════
// ดึง max temp จาก aging_tank_states — ใช้ร่วมกันทุกหน้า
export function getMaxTemp(tankState){
  if(!tankState) return null;
  var vals=[];
  if(tankState.max_temp!=null) vals.push(+tankState.max_temp);
  if(tankState.temps&&typeof tankState.temps==='object'){
    Object.values(tankState.temps).forEach(function(v){
      if(v!=null&&!isNaN(+v)) vals.push(+v);
    });
  }
  Object.keys(tankState).forEach(function(k){
    if(k.startsWith('temps.')&&!isNaN(+tankState[k])) vals.push(+tankState[k]);
  });
  return vals.length?Math.max.apply(null,vals):null;
}

// ══ EXPIRE ALERT BAR ══════════════════════════════════════════════════
// แสดง alert bar ใน cipman และ leadman เมื่อมีถังที่ใกล้หมดอายุ
// agingStates = object ของ aging_tank_states
// targetEl = DOM element ที่จะใส่ alert bar
export function renderExpireAlertBar(agingStates, targetEl){
  if(!targetEl) return;
  var now = new Date();
  var alerts = [];
  Object.values(agingStates||{}).forEach(function(ts){
    if(!ts||!ts.expire_at) return;
    if(!ts.mix_code&&!ts.mix_name) return; // ถังว่าง
    var ed = new Date(ts.expire_at);
    var rh = (ed - now) / 3600000;
    if(rh > 48) return; // ยังไม่ต้องเตือน
    alerts.push({ ts:ts, rh:rh, tank:ts.id||'?' });
  });
  if(!alerts.length){ targetEl.innerHTML=''; return; }
  // เรียงจากน้อยสุดก่อน
  alerts.sort(function(a,b){ return a.rh - b.rh; });
  var html = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 0">';
  html += '<span style="font-family:DM Mono,monospace;font-size:10px;font-weight:900;color:#b91c1c;letter-spacing:.06em;flex-shrink:0">⚠️ EXPIRE ALERT</span>';
  alerts.forEach(function(a){
    var isExp = a.rh < 0;
    var isCrit = !isExp && a.rh < 24;
    var bc = isExp ? '#b91c1c' : isCrit ? '#c2410c' : '#b45309';
    var bg = isExp ? 'rgba(185,28,28,.12)' : isCrit ? 'rgba(194,65,12,.08)' : 'rgba(180,83,9,.08)';
    var ic = isExp ? '❌' : isCrit ? '🔴' : '🟡';
    var remStr = isExp ? 'หมดแล้ว' : a.rh < 1 ? Math.round(a.rh*60)+'น.' : a.rh < 24 ? a.rh.toFixed(1)+'ชม.' : Math.floor(a.rh/24)+'วัน';
    html += '<div style="display:inline-flex;align-items:center;gap:5px;background:'+bg+';border:1.5px solid '+bc+';border-radius:8px;padding:3px 10px;font-family:DM Mono,monospace;white-space:nowrap">';
    html += '<span style="font-size:12px">'+ic+'</span>';
    html += '<span style="font-size:11px;font-weight:900;color:'+bc+'">'+a.tank+'</span>';
    html += '<span style="font-size:11px;color:'+bc+';opacity:.8">'+(a.ts.mix_name||a.ts.mix_code||'')+'</span>';
    html += '<span style="font-size:11px;font-weight:900;color:'+bc+'">'+remStr+'</span>';
    html += '</div>';
  });
  html += '</div>';
  targetEl.innerHTML = html;
}

// แสดง temperature badge
export function tempBox(tankState){
  var t=getMaxTemp(tankState);
  if(t==null) return '';
  var ok=t<=6;
  var warn=t>6&&t<=8;
  var bc=ok?'#15803d':warn?'#c2410c':'#b91c1c';
  var bg=ok?'rgba(21,128,61,.1)':warn?'rgba(194,65,12,.08)':'rgba(185,28,28,.1)';
  var ic=ok?'🌡️':warn?'⚠️':'🔴';
  return '<div style="display:inline-flex;align-items:center;gap:4px;background:'+bg+';border:1.5px solid '+bc+';border-radius:7px;padding:3px 9px;font-family:DM Mono,monospace;font-size:12px;font-weight:900;color:'+bc+'">'+ic+' '+t+'°C</div>';
}
