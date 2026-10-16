/* Nova engine: safe math parser + units (no eval) */
let DEG = true, ANS = 0;
const FNS = {
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
  sin: x => DEG ? Math.sin(x*Math.PI/180) : Math.sin(x),
  cos: x => DEG ? Math.cos(x*Math.PI/180) : Math.cos(x),
  tan: x => DEG ? Math.tan(x*Math.PI/180) : Math.tan(x),
  ln: Math.log, log: Math.log10
};
function fa2en(s){
  s = String(s);
  s = s.replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  s = s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  return s;
}
function fact(n){ if(n<0||!Number.isInteger(n)||n>170) throw 'factorial invalid'; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function fmt(n){
  if(typeof n!=='number'||!isFinite(n)||isNaN(n)) return 'Error';
  if(Math.abs(n)<1e-12) n=0;
  let r = parseFloat(n.toPrecision(11));
  let s = String(r);
  if(s.includes('e')) return r.toExponential(5);
  let neg = s.startsWith('-'); if(neg) s=s.slice(1);
  let parts = s.split('.');
  if(parts[0].length>12) return r.toExponential(5);
  parts[0] = Number(parts[0]).toLocaleString('en-US');
  return (neg?'-':'') + parts.join('.');
}
function smart(src){
  let s = ' ' + fa2en(String(src)).toLowerCase().trim() + ' ';
  s = s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'');
  s = s.replace(/(\d)\s*\(/g,'$1*(').replace(/\)\s*\(/g,')*(');
  let m;
  if(m = s.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/)){
    let v = parseFloat(m[1])/100*parseFloat(m[2]);
    return { e:String(v), note:m[1]+'% of '+m[2], v:v };
  }
  if(m = s.match(/tip\s*(\d+\.?\d*)\s*%\s*on\s*(\d+\.?\d*)/)){
    let v = parseFloat(m[2])*(1+parseFloat(m[1])/100);
    return { e:String(v), note:'tip '+m[1]+'% on '+m[2], v:v };
  }
  if(m = s.match(/(\d+\.?\d*)\s*%\s*(off|discount)\s*(?:on\s*)?(\d+\.?\d*)/)){
    let v = parseFloat(m[3])*(1-parseFloat(m[1])/100);
    return { e:String(v), note:m[1]+'% off '+m[3], v:v };
  }
  if(m = s.match(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)\s*%$/)){
    let v = parseFloat(m[1])*(1+parseFloat(m[2])/100);
    return { e:String(v), note:m[1]+' + '+m[2]+'%', v:v };
  }
  let um = s.match(/([\d.]+)\s*([a-z°]+)\s*(to|in)\s*([a-z°]+)/);
  if(um){
    let v = quickConv(parseFloat(um[1]), unorm(um[2]), unorm(um[4]));
    if(v!==null&&v!==undefined) return { e:String(v), note:um[1]+' '+um[2]+' -> '+um[4], v:v };
  }
  return { e:s.trim(), note:'', v:null };
}
function tokenize(expr){
  expr = fa2en(expr).replace(/\s+/g,'');
  expr = expr.replace(/pi/gi,'@').replace(/ans/gi,'#');
  expr = expr.replace(/(\d)([@#a-z(])/gi,'$1*$2').replace(/([)#])([(@#\d])/g,'$1*$2');
  let t=[], i=0;
  while(i<expr.length){
    let c = expr[i];
    if(/[0-9.]/.test(c)){ let n=''; while(i<expr.length&&/[0-9.]/.test(expr[i])) n+=expr[i++]; t.push({t:'n',v:parseFloat(n)}); continue; }
    if(/[@#a-zx]/i.test(c)){ let w=''; while(i<expr.length&&/[@#a-zx]/i.test(expr[i])) w+=expr[i++]; t.push({t:'w',v:w}); continue; }
    if('+-*/^()%!'.includes(c)){ t.push({t:'o',v:c}); i++; continue; }
    throw 'invalid char';
  }
  return t;
}
function toRPN(t){
  let o=[], s=[], P={'+':1,'-':1,'*':2,'/':2,'^':3,'u':4}, prev=null;
  for(let x of t){
    if(x.t==='n'){ o.push(x); prev=x; continue; }
    if(x.t==='w'){
      if(['sin','cos','tan','ln','log','sqrt','abs','exp'].includes(x.v)) s.push(x);
      else if(['@','e','#','x','X'].includes(x.v)) o.push(x);
      else throw 'unknown: '+x.v;
      prev=x; continue;
    }
    if(x.v==='('){ s.push(x); prev=x; continue; }
    if(x.v===')'){
      while(s.length&&s[s.length-1].v!=='(') o.push(s.pop());
      if(!s.length) throw 'paren mismatch'; s.pop();
      if(s.length&&s[s.length-1].t==='w') o.push(s.pop());
      prev=x; continue;
    }
    if(x.v==='!'){ o.push(x); prev=x; continue; }
    if(x.v==='%'){ o.push(x); prev=x; continue; }
    if((x.v==='-'||x.v==='+')&&(!prev||(prev.t==='o'&&prev.v!==')'&&prev.v!=='!'))){
      if(x.v==='-') s.push({t:'o',v:'u'}); prev=x; continue;
    }
    while(s.length&&s[s.length-1].t==='o'&&s[s.length-1].v!=='('){
      let a=s[s.length-1].v;
      if(P[a]>P[x.v]||(P[a]===P[x.v]&&x.v!=='^')) o.push(s.pop()); else break;
    }
    s.push(x); prev=x;
  }
  while(s.length){ let a=s.pop(); if(a.v==='('||a.v===')') throw 'paren mismatch'; o.push(a); }
  return o;
}
function runRPN(r, vars){
  let st=[];
  for(let x of r){
    if(x.t==='n') st.push(x.v);
    else if(x.t==='w'){
      if(x.v==='@') st.push(Math.PI);
      else if(x.v==='e') st.push(Math.E);
      else if(x.v==='#') st.push(ANS);
      else if(x.v==='x'||x.v==='X') st.push(vars&&vars.x!==undefined?vars.x:0);
      else { let a=st.pop(); if(a===undefined) throw 'incomplete'; st.push(FNS[x.v](a)); }
    } else {
      let v=x.v;
      if(v==='u') st.push(-st.pop());
      else if(v==='!') st.push(fact(st.pop()));
      else if(v==='%') st.push(st.pop()/100);
      else {
        let b=st.pop(), a=st.pop();
        if(a===undefined||b===undefined) throw 'incomplete';
        if(v==='+') st.push(a+b); if(v==='-') st.push(a-b);
        if(v==='*') st.push(a*b);
        if(v==='/'){ if(b===0) throw 'division by zero'; st.push(a/b); }
        if(v==='^') st.push(Math.pow(a,b));
      }
    }
  }
  if(st.length!==1) throw 'incomplete';
  return st[0];
}
function EV(expr, vars){ return runRPN(toRPN(tokenize(expr)), vars||{}); }
/* units */
const U = {
  length:{u:{mm:0.001,cm:0.01,m:1,km:1000,in:0.0254,ft:0.3048,yd:0.9144,mile:1609.34}},
  weight:{u:{mg:1e-6,g:0.001,kg:1,ton:1000,lb:0.453592,oz:0.0283495}},
  time:{u:{ms:0.001,s:1,min:60,h:3600,day:86400,week:604800}},
  data:{u:{B:1,KB:1000,MB:1e6,GB:1e9,TB:1e12}},
  area:{u:{m2:1,km2:1e6,ft2:0.092903,acre:4046.86,hectare:10000}},
  volume:{u:{ml:0.001,L:1,m3:1000,cup:0.24,gallon:3.78541}},
  speed:{u:{ms:1,kmh:1/3.6,mph:0.44704,knot:0.514444}}
};
const ALIAS = {kilometer:'km',kilometers:'km',meter:'m',meters:'m',mile:'mile',miles:'mile',foot:'ft',feet:'ft',inch:'in',inches:'in',pound:'lb',pounds:'lb',kilo:'kg',kilos:'kg',celsius:'c',celsuis:'c',fahrenheit:'f',kelvin:'k',sec:'s',secs:'s',hour:'h',hours:'h',liter:'L',litre:'L',liters:'L'};
function unorm(x){ x=String(x).toLowerCase().replace('°',''); return ALIAS[x]||x; }
function convTemp(v,a,b){ let c = a==='c'?v : a==='f'?(v-32)*5/9 : v-273.15; return b==='c'?c : b==='f'?c*9/5+32 : c+273.15; }
function quickConv(v,a,b){
  a=unorm(a); b=unorm(b);
  if((a==='c'||a==='f'||a==='k')&&(b==='c'||b==='f'||b==='k')) return convTemp(v,a,b);
  for(let k in U){ if(U[k].u[a]!==undefined&&U[k].u[b]!==undefined) return v*U[k].u[a]/U[k].u[b]; }
  return null;
}
