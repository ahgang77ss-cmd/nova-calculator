const $ = s => document.querySelector(s);
const q = $('#q'), big = $('#big'), interp = $('#interp'), hist = $('#hist');
function toast(m){ const t=$('#t'); t.textContent=m; t.classList.add('s'); clearTimeout(t._); t._=setTimeout(()=>t.classList.remove('s'),1800); }
function live(){
  let s = q.value.trim();
  if(!s){ big.textContent='0'; big.classList.remove('live'); interp.textContent='…'; return; }
  try{
    let r = smart(s);
    let v = (r.v!==null) ? r.v : EV(r.e);
    big.textContent = fmt(v); big.classList.add('live');
    interp.textContent = r.note ? ('✦ '+r.note) : ('= '+r.e);
  }catch(e){ big.textContent='…'; big.classList.remove('live'); interp.textContent = String(e); }
}
function commit(){
  let s = q.value.trim(); if(!s) return;
  try{
    let r = smart(s);
    let v = (r.v!==null) ? r.v : EV(r.e);
    ANS = v; let f = fmt(v);
    addH(s, f); q.value = f.replace(/,/g,''); live(); big.classList.remove('live');
  }catch(e){ toast('خطا: '+e); }
}
function saveH(){ try{ localStorage.setItem('nova3', hist.innerHTML); }catch(e){} }
function addH(a,b){
  document.querySelector('.empty')?.remove();
  let d=document.createElement('div'); d.className='h';
  d.innerHTML='<div class="a"></div><div class="b"></div><button class="del" title="حذف">×</button>';
  d.querySelector('.a').textContent=a; d.querySelector('.b').textContent=b;
  hist.prepend(d);
  while(hist.children.length>30) hist.lastChild.remove();
  saveH();
}
hist.addEventListener('click', e=>{
  const del = e.target.closest('.del');
  if(del){ del.closest('.h').remove(); saveH();
    if(!hist.children.length) hist.innerHTML='<div class="empty">هنوز محاسبه‌ای نیست ✨</div>';
    return; }
  const h = e.target.closest('.h');
  if(h){ q.value=h.querySelector('.a').textContent; live(); q.focus(); }
});
function loadH(){
  try{ let h=localStorage.getItem('nova3'); if(h) hist.innerHTML=h; }catch(e){}
  if(!hist.children.length) hist.innerHTML='<div class="empty">هنوز محاسبه‌ای نیست ✨</div>';
}
document.querySelectorAll('[data-ins]').forEach(b=>b.onclick=()=>{
  let s=b.dataset.ins, i=q.selectionStart??q.value.length, j=q.selectionEnd??i;
  q.value=q.value.slice(0,i)+s+q.value.slice(j); q.focus();
  q.setSelectionRange(i+s.length,i+s.length); live();
});
$('#c').onclick=()=>{ q.value=''; live(); q.focus(); };
$('#bk').onclick=()=>{ q.value=q.value.slice(0,-1); live(); };
$('#eq').onclick=commit; $('#go').onclick=commit;
q.addEventListener('input',live);
q.addEventListener('keydown',e=>{
  if(e.key==='Enter'){ commit(); }
  else if(e.key==='='){ e.preventDefault(); commit(); }
  else if(e.key==='Escape'){ q.value=''; live(); }
});
function syncMeta(){ const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content = document.documentElement.dataset.theme==='dark' ? '#070b18' : '#e9efff'; }
try{ const st=localStorage.getItem('nova-theme'); if(st) document.documentElement.dataset.theme=st; }catch(e){}
try{ const dg=localStorage.getItem('nova-deg'); if(dg!==null){ DEG = dg==='1'; const db=$('#deg'); db.textContent=DEG?'DEG':'RAD'; db.classList.toggle('on',!DEG); } }catch(e){}
syncMeta();
$('#deg').onclick=e=>{ DEG=!DEG; e.target.textContent=DEG?'DEG':'RAD'; e.target.classList.toggle('on',!DEG); try{localStorage.setItem('nova-deg',DEG?'1':'0');}catch(_){} live(); };
$('#ch').onclick=()=>{ hist.innerHTML='<div class="empty">هنوز محاسبه‌ای نیست ✨</div>'; try{localStorage.removeItem('nova3');}catch(e){} };
$('#cpy').onclick=()=>{ navigator.clipboard?.writeText(big.textContent); toast('کپی شد: '+big.textContent); };
$('#th').onclick=()=>{ let h=document.documentElement; h.dataset.theme=h.dataset.theme==='dark'?'light':'dark'; try{localStorage.setItem('nova-theme',h.dataset.theme);}catch(e){} syncMeta(); };
const EX=['15% of 240','20% off 99','tip 15% on 85.5','(12+8)*3/4','2^10','sqrt(144)','5 km to mile','sin(30)+cos(60)'];
$('#chips').innerHTML = EX.map(e=>'<span class="chip"></span>').join('');
document.querySelectorAll('#chips .chip').forEach((c,i)=>{ c.textContent=EX[i]; c.onclick=()=>{ q.value=EX[i]; live(); }; });
document.querySelectorAll('.tab[data-t]').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab[data-t]').forEach(x=>x.classList.remove('on')); t.classList.add('on');
  ['c','v','f','p','h','g'].forEach(k=>{ $('#t-'+k).hidden = (t.dataset.t!==k); });
  if(t.dataset.t==='g') draw();
});
/* converter */
let cat='length';
const cats={length:'طول',weight:'وزن',temp:'دما',time:'زمان',data:'دیتا',area:'مساحت',volume:'حجم',speed:'سرعت'};
$('#cats').innerHTML=Object.keys(cats).map(k=>'<button class="tab'+(k===cat?' on':'')+'" data-c="'+k+'">'+cats[k]+'</button>').join('');
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ cat=b.dataset.c;
  document.querySelectorAll('[data-c]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); fillU(); cv(); });
function fillU(){
  let f=$('#cf'), t=$('#ct');
  let list = cat==='temp' ? ['c','f','k'] : Object.keys(U[cat].u);
  f.innerHTML=list.map(u=>'<option>'+u+'</option>').join('');
  t.innerHTML=list.map(u=>'<option>'+u+'</option>').join('');
  if(list[1]) t.selectedIndex=1;
}
function cv(){
  let v=parseFloat(fa2en($('#cv').value)); if(isNaN(v)){ $('#cvOut').textContent='—'; return; }
  let a=$('#cf').value, b=$('#ct').value, r;
  r = cat==='temp' ? convTemp(v,unorm(a),unorm(b)) : v*U[cat].u[a]/U[cat].u[b];
  $('#cvOut').textContent = fmt(v)+' '+a+' = '+fmt(r)+' '+b;
}
['cv','cf','ct'].forEach(id=>$('#'+id).addEventListener('input',cv));
fillU(); cv();
/* finance */
function loanCalc(){
  let P=parseFloat(fa2en($('#ln-p').value))||0, yr=parseFloat(fa2en($('#ln-r').value))||0, n=parseFloat(fa2en($('#ln-n').value))||0;
  let m=yr/100/12, pay = m===0 ? P/n : P*m/(1-Math.pow(1+m,-n));
  $('#ln-out').textContent = n>0 ? fmt(pay) : '—';
  $('#ln-tot').innerHTML = n>0 ? '<div class="kv"><span>مجموع بازپرداخت</span><b>'+fmt(pay*n)+'</b></div><div class="kv"><span>مجموع سود</span><b>'+fmt(pay*n-P)+'</b></div>' : '';
}
['ln-p','ln-r','ln-n'].forEach(id=>$('#'+id).addEventListener('input',loanCalc)); loanCalc();
function pctCalc(){
  let a=parseFloat(fa2en($('#pc-a').value))||0, b=parseFloat(fa2en($('#pc-b').value))||0;
  $('#pc-out').textContent = b!==0 ? (a/b*100).toFixed(2)+'%' : '—';
}
['pc-a','pc-b'].forEach(id=>$('#'+id).addEventListener('input',pctCalc)); pctCalc();
/* programmer */
function prog(){
  let s=fa2en($('#pg-in').value).trim().replace(/\s+/g,'');
  let base=$('#pg-base').value, v;
  try{
    if(base==='dec') v=parseInt(s,10);
    if(base==='hex') v=parseInt(s.replace(/^0x/i,''),16);
    if(base==='bin') v=parseInt(s.replace(/[^01]/g,''),2);
    if(base==='oct') v=parseInt(s,8);
    if(isNaN(v)) throw 0;
    $('#pg-dec').textContent=String(v); $('#pg-hex').textContent='0x'+v.toString(16).toUpperCase();
    $('#pg-bin').textContent=v.toString(2); $('#pg-oct').textContent=v.toString(8);
  }catch(e){ $('#pg-dec').textContent='—'; }
}
['pg-in','pg-base'].forEach(id=>$('#'+id).addEventListener('input',prog)); prog();
/* health */
function bmi(){
  let h=parseFloat(fa2en($('#bm-h').value))||0, w=parseFloat(fa2en($('#bm-w').value))||0;
  if(h<=0||w<=0){ $('#bm-out').textContent='—'; $('#bm-cls').textContent=''; return; }
  let m=h/100, v=w/(m*m);
  $('#bm-out').textContent=v.toFixed(1);
  $('#bm-cls').textContent = v<18.5?'کمبود وزن':v<25?'نرمال ✅':v<30?'اضافه وزن':'چاقی';
}
['bm-h','bm-w'].forEach(id=>$('#'+id).addEventListener('input',bmi)); bmi();
/* graph */
const COLS=['#00d4ff','#7c5cff','#ff9f0a','#3ddc84','#ff6b9d'];
const GX=['x^2','sin(x)*8','x^3/20 - 2*x','sqrt(abs(x))*4'];
$('#gch').innerHTML=GX.map(s=>'<span class="chip"></span>').join('');
document.querySelectorAll('#gch .chip').forEach((c,i)=>{ c.textContent=GX[i]; c.onclick=()=>{ $('#fx').value=GX[i]; draw(); }; });
$('#draw').onclick=draw;
function draw(){
  let c2=$('#plot'); if(!c2) return;
  const dpr = Math.min(window.devicePixelRatio||1, 3);
  const cssW = c2.clientWidth||860, cssH = 340;
  c2.width = Math.round(cssW*dpr); c2.height = Math.round(cssH*dpr);
  let ctx=c2.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  let W=cssW, H=cssH;
  let x0=parseFloat($('#x0').value), x1=parseFloat($('#x1').value), y0=parseFloat($('#y0').value), y1=parseFloat($('#y1').value);
  if(!(x1>x0)||!(y1>y0)){ $('#gmsg').textContent='بازه نامعتبر است'; return; }
  ctx.clearRect(0,0,W,H);
  const X=x=>(x-x0)/(x1-x0)*W, Y=y=>H-(y-y0)/(y1-y0)*H;
  ctx.strokeStyle='rgba(127,127,127,.25)'; ctx.lineWidth=1;
  for(let i=0;i<=10;i++){
    let gx=X(x0+(x1-x0)*i/10); ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    let gy=Y(y0+(y1-y0)*i/10); ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
  }
  ctx.strokeStyle='rgba(160,170,200,.6)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,Y(0)); ctx.lineTo(W,Y(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0),0); ctx.lineTo(X(0),H); ctx.stroke();
  ctx.fillStyle='rgba(140,150,180,.85)'; ctx.font='10px JetBrains Mono';
  for(let i=0;i<=10;i+=2){
    let xv=x0+(x1-x0)*i/10; ctx.fillText(fmt(xv), Math.min(X(xv)+4,W-34), Math.max(Y(0)-5,10));
    let yv=y0+(y1-y0)*i/10; ctx.fillText(fmt(yv), Math.min(Math.max(X(0)+5,4),W-34), Y(yv)-4);
  }
  let fns=$('#fx').value.split(';').map(s=>s.trim()).filter(Boolean);
  let keep=DEG; DEG=false; let ok=0;
  fns.slice(0,5).forEach((f,i)=>{
    try{
      ctx.strokeStyle=COLS[i%COLS.length]; ctx.lineWidth=3; ctx.shadowColor=COLS[i%COLS.length]; ctx.shadowBlur=10;
      ctx.beginPath(); let st=false;
      for(let px=0;px<=W;px+=2){
        let x=x0+(x1-x0)*px/W, y;
        try{ y=EV(f,{x}); }catch(e){ y=NaN; }
        if(!isFinite(y)){ st=false; continue; }
        let py=Y(y); if(!st){ ctx.moveTo(px,py); st=true; } else ctx.lineTo(px,py);
      }
      ctx.stroke(); ctx.shadowBlur=0; ok++;
      ctx.fillStyle=COLS[i%COLS.length]; ctx.font='bold 13px JetBrains Mono';
      ctx.fillText('f'+(i+1)+': '+f,12,22+i*20);
    }catch(e){}
  });
  DEG=keep;
  $('#gmsg').textContent = ok ? ok+' تابع رسم شد (رادیان).' : 'خطا در تابع — مثال: x^2';
}
/* voice: fixed error handling */
(function(){
  const btn=$('#mic');
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ btn.disabled=true; btn.title='مرورگر شما صوت را پشتیبانی نمی‌کند (کروم لازم است)'; return; }
  btn.onclick=()=>{
    try{
      const r=new SR(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=1;
      toast('🎙 گوش می‌دهم… (انگلیسی بگو)');
      r.onresult=e=>{
        let s=e.results[0][0].transcript.toLowerCase();
        s=s.replace(/plus/g,'+').replace(/minus/g,'-').replace(/times|multiply by/g,'*').replace(/divide by|divided by|over/g,'/').replace(/power/g,'^');
        q.value=s; live(); toast('شنیده شد');
      };
      r.onerror=e=>{ toast('خطای صوتی: نیاز به HTTPS/کروم و اجازه میکروفون ('+e.error+')'); };
      r.onend=()=>{};
      r.start();
    }catch(e){ toast('صوت پشتیبانی نشد'); }
  };
})();
loadH(); live();
/* install prompt */
(function(){
  let ev = null;
  const b = document.querySelector('#install');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); ev = e;
    if (b) b.hidden = false;
  });
  if (b) b.onclick = async () => {
    if (!ev) { toast('از منوی مرورگر گزینه نصب / Add to Home Screen را بزن'); return; }
    ev.prompt(); await ev.userChoice; ev = null; b.hidden = true;
  };
  window.addEventListener('appinstalled', () => { toast('نصب شد ✅'); if (b) b.hidden = true; });
})();
