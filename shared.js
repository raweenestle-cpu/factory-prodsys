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
