// Scènes de la vidéo LinkedIn — injecté dans Diamba_Sud_Fosse_3D_Pushbacks.html
// renderFrame(t) dessine l'état de la vidéo au temps t (s). Rendu déterministe image par image.
(function(){
"use strict";
const W=1080,H=1350,TOP=200,BOT=230;
const NAVY="#0b1f3a",GOLD="#f5b301",INK="#0f172a",MUT="#5b6877";
const css=document.createElement("style");
css.textContent=`
html,body{overflow:hidden!important;background:#e9eef5!important}
body>header,main>.card,main>.grid2,main>.grid2>.card{visibility:hidden!important}
#wrap3d{visibility:visible;position:fixed!important;left:0;top:${TOP}px;width:${W}px;height:${H-TOP-BOT}px;border:0!important;border-radius:0!important;background:#e9eef5!important;z-index:1}
#c3d{height:100%!important}
#hud,#busy{display:none!important}
#csec{visibility:hidden;position:fixed!important;left:30px;top:${TOP+20}px;width:${W-60}px!important;height:${H-TOP-BOT-40}px!important;z-index:2;border:0!important;background:#f4f6f9!important}
#ov{position:fixed;inset:0;z-index:5;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:${INK}}
#band{position:absolute;left:0;top:0;width:${W}px;height:${TOP}px;background:${NAVY};color:#fff;padding:34px 48px 0;box-sizing:border-box}
#band .k{color:${GOLD};font-weight:800;font-size:26px;letter-spacing:2px}
#band .t{font-size:44px;font-weight:800;line-height:1.12;margin-top:10px}
#vcap{position:absolute;left:0;bottom:0;width:${W}px;height:${BOT}px;background:${NAVY};color:#fff;padding:26px 48px;box-sizing:border-box;font-size:29px;line-height:1.35}
#vcap b{color:${GOLD}}
#panel{position:absolute;left:0;top:${TOP}px;width:${W}px;height:${H-TOP-BOT}px;background:#f4f6f9;padding:40px 48px;box-sizing:border-box}
#full{position:absolute;inset:0;background:${NAVY};color:#fff;padding:120px 70px;box-sizing:border-box}
#veil{position:absolute;inset:0;background:${NAVY};pointer-events:none}
#sig{position:absolute;right:30px;top:${TOP+16}px;font-size:19px;color:${MUT};background:rgba(255,255,255,.75);padding:4px 10px;border-radius:6px}
.li{font-size:31px;margin:0 0 18px;display:flex;gap:14px;align-items:flex-start}
.li i{font-style:normal;color:#16a34a;font-weight:900}
.li.w i{color:#d97706}
.kp{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.kp div{background:#fff;border:2px solid #dde3ea;border-radius:14px;padding:16px 18px}
.kp b{display:block;font-size:40px;color:${NAVY}}
.kp span{font-size:21px;color:${MUT}}
.chip{display:inline-block;width:22px;height:22px;border-radius:4px;vertical-align:-3px;margin-right:6px;border:1px solid rgba(0,0,0,.25)}
svg text{font-family:system-ui,sans-serif}
`;
document.head.appendChild(css);
const ov=document.createElement("div");ov.id="ov";
ov.innerHTML=`<div id="panel"></div><div id="band"><div class="k"></div><div class="t"></div></div><div id="vcap"></div><div id="sig">S. A. Sankhare · Mine Planning</div><div id="full"></div><div id="veil"></div>`;
document.body.appendChild(ov);
const $=id=>document.getElementById(id);
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
const fr=(x,d=1)=>x.toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d});
const seg=(p,a,b)=>ease((p-a)/(b-a));

// ---------- données intercepts ----------
const ENV=D.filter(r=>r.lvl==="E").map(e=>{const inc=D.filter(r=>r.par===e.id);const gm=e.au*e.tw,gi=inc.reduce((s,r)=>s+r.au*r.tw,0);return {...e,inc,gm,share:gi/gm*100};});
const capCurve=c=>{let a=0,t=0;ENV.forEach(e=>{const gi=e.inc.reduce((s,r)=>s+r.au*r.tw,0),gc=e.inc.reduce((s,r)=>s+Math.min(r.au,c)*r.tw,0);a+=e.gm-gi+gc;t+=e.tw;});return a/t;};

// ---------- helpers mise en page ----------
let last={};
function set(id,html){if(last[id]!==html){$(id).innerHTML=html;last[id]=html;}}
function show(id,on){const el=$(id);const v=on?"":"none";if(el.style.display!==v)el.style.display=v;}
function band(k,t){set("band",`<div class="k">${k}</div><div class="t">${t}</div>`);}
function use3d(on){$("wrap3d").style.visibility=on?"visible":"hidden";if(on)show("panel",0);}
function useSec(on){$("csec").style.visibility=on?"visible":"hidden";if(on)show("panel",0);}
function ctl(mode,waste,holes,cutax,cut){$("mode").value=mode;$("waste").checked=waste;$("holes").checked=holes;$("cutax").value=cutax;$("cut").max=9999;$("cut").value=cut;}
let lastKey="";
function scene3d(key,step){if(key!==lastKey||step!==STEP){STEP=step;buildFaces();lastKey=key;}draw();}

// ---------- SVG charts ----------
function barsShare(p){
  const rows=[...ENV].filter(e=>e.inc.length).sort((a,b)=>b.share-a.share).slice(0,8),w=980,h=420,L=200,R=60,rh=48;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="0" y="24" font-size="24" font-weight="700" fill="${INK}">Part du métal portée par les pics inclus (0,8–1,6 m)</text>`;
  rows.forEach((r,i)=>{const y=50+i*rh,v=r.share*seg(p,0.05+i*0.04,0.45+i*0.04),bw=(w-L-R)*v/100,c=r.share>60?"#dc2626":r.share>40?"#d97706":"#16a34a";
    s+=`<text x="${L-12}" y="${y+30}" font-size="23" text-anchor="end" fill="${INK}">${r.id}</text><rect x="${L}" y="${y+6}" width="${bw}" height="${rh-14}" rx="6" fill="${c}"/><text x="${L+bw+10}" y="${y+31}" font-size="23" font-weight="700" fill="${INK}">${fr(v,0)} %</text>`;});
  return s+"</svg>";
}
function histo(p){
  const cls=[[0.5,1],[1,2],[2,4],[4,8],[8,16],[16,32],[32,64]],w=980,h=430,L=60,B=70,T=50;
  const ce=cls.map(([a,b])=>ENV.filter(e=>e.au>=a&&e.au<b).length),ci=cls.map(([a,b])=>D.filter(r=>r.lvl==="I"&&r.au>=a&&r.au<b).length);
  const mx=Math.max(...cls.map((c,i)=>ce[i]+ci[i])),bw=(w-L-20)/cls.length;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="0" y="26" font-size="24" font-weight="700" fill="${INK}">Histogramme des teneurs (classes log, g/t)</text>`;
  cls.forEach((c,i)=>{const x=L+i*bw+10,g=seg(p,0.05+i*0.05,0.4+i*0.05),he=(h-T-B)*ce[i]/mx*g,hi=(h-T-B)*ci[i]/mx*g,y0=h-B;
    s+=`<rect x="${x}" y="${y0-he}" width="${bw-20}" height="${he}" fill="${NAVY}" rx="4"/><rect x="${x}" y="${y0-he-hi}" width="${bw-20}" height="${hi}" fill="${GOLD}" rx="4"/>`;
    if(g>0.9)s+=`<text x="${x+(bw-20)/2}" y="${y0-he-hi-10}" font-size="22" text-anchor="middle" fill="${INK}" font-weight="700">${ce[i]+ci[i]}</text>`;
    s+=`<text x="${x+(bw-20)/2}" y="${y0+30}" font-size="21" text-anchor="middle" fill="${MUT}">${c[0]}–${c[1]}</text>`;});
  s+=`<rect x="${L}" y="${h-28}" width="20" height="20" fill="${NAVY}"/><text x="${L+28}" y="${h-11}" font-size="21" fill="${INK}">enveloppes (22)</text><rect x="${L+260}" y="${h-28}" width="20" height="20" fill="${GOLD}"/><text x="${L+288}" y="${h-11}" font-size="21" fill="${INK}">pics inclus (29)</text>`;
  return s+"</svg>";
}
function capChart(p){
  const w=980,h=380,L=70,R=30,T=50,B=50,xs=[];for(let c=5;c<=60;c++)xs.push(c);
  const X=c=>L+(c-5)/55*(w-L-R),Y=v=>T+(1-(v-2)/(3.4-2))*(h-T-B),n=Math.max(2,Math.floor(xs.length*seg(p,0.1,0.8)));
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="0" y="26" font-size="24" font-weight="700" fill="${INK}">Teneur pondérée des enveloppes vs top-cut</text>`;
  [2,2.4,2.8,3.2].forEach(v=>s+=`<line x1="${L}" x2="${w-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#dde3ea"/><text x="${L-10}" y="${Y(v)+7}" font-size="20" text-anchor="end" fill="${MUT}">${fr(v)}</text>`);
  [10,20,30,40,50,60].forEach(c=>s+=`<text x="${X(c)}" y="${h-15}" font-size="20" text-anchor="middle" fill="${MUT}">${c} g/t</text>`);
  s+=`<path d="${xs.slice(0,n).map((c,i)=>(i?"L":"M")+X(c)+","+Y(capCurve(c))).join("")}" fill="none" stroke="${NAVY}" stroke-width="5"/>`;
  const raw=capCurve(1e9);s+=`<line x1="${L}" x2="${w-R}" y1="${Y(raw)}" y2="${Y(raw)}" stroke="${GOLD}" stroke-width="3" stroke-dasharray="8 6"/><text x="${w-R}" y="${Y(raw)-10}" font-size="21" text-anchor="end" fill="#b7791f" font-weight="700">sans top-cut ${fr(raw,2)} g/t</text>`;
  [[10,"−25 %"],[20,"−9 %"]].forEach(([c,l])=>{if(xs.indexOf(c)<n){const v=capCurve(c);s+=`<circle cx="${X(c)}" cy="${Y(v)}" r="10" fill="#dc2626"/><text x="${X(c)+16}" y="${Y(v)+30}" font-size="23" font-weight="800" fill="#dc2626">${fr(v,2)} g/t (${l})</text>`;}});
  return s+"</svg>";
}
function pbChart(p){
  const rows=[];for(let q=1;q<=M.npb;q++){let ot=0,wt=0,oz=0;M.steps.filter(s=>s.pb===q).forEach(s=>{ot+=s.ot;wt+=s.wt;oz+=s.oz;});rows.push({q,ot,wt,oz});}
  const w=980,h=470,L=70,B=60,T=50,mx=Math.max(...rows.map(r=>r.ot+r.wt))/1e6,bw=(w-L-40)/rows.length;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="0" y="26" font-size="24" font-weight="700" fill="${INK}">Tonnages par pushback (Mt) — minerai / stérile — et ratio de découverture</text>`;
  rows.forEach((r,i)=>{const g=seg(p,0.05+i*0.1,0.4+i*0.1),x=L+i*bw+20,y0=h-B,ho=(h-T-B-30)*r.ot/1e6/mx*g,hw=(h-T-B-30)*r.wt/1e6/mx*g,c=rgb(PBC[i%6]);
    s+=`<rect x="${x}" y="${y0-ho}" width="${bw-40}" height="${ho}" fill="${c}" rx="4"/><rect x="${x}" y="${y0-ho-hw}" width="${bw-40}" height="${hw}" fill="${c}" fill-opacity=".3" rx="4"/>`;
    if(g>0.9)s+=`<text x="${x+(bw-40)/2}" y="${y0-ho-hw-12}" font-size="26" text-anchor="middle" font-weight="800" fill="${INK}">SR ${fr(r.wt/r.ot,1)}</text><text x="${x+(bw-40)/2}" y="${y0-ho/2+8}" font-size="21" text-anchor="middle" fill="#fff" font-weight="700">${fr(r.ot/1e6,1)} Mt</text>`;
    s+=`<text x="${x+(bw-40)/2}" y="${y0+34}" font-size="24" text-anchor="middle" font-weight="700" fill="${INK}">PB${r.q} · ${fr(r.oz/1e3,0)} koz</text>`;});
  return s+"</svg>";
}
function npvChart(p){
  const w=980,h=330,L=230,R=120,rows=[["3 500 $/oz",1009,"TRI 60 % · payback ~12 mois"],["4 000 $/oz",1287,"TRI 72 % · payback ~11 mois"]],mx=1400;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="0" y="26" font-size="24" font-weight="700" fill="${INK}">VAN 5 % après impôt (M$) — étude de faisabilité 06/2026</text>`;
  rows.forEach((r,i)=>{const y=60+i*125,g=seg(p,0.1+i*0.15,0.5+i*0.15),bw=(w-L-R)*r[1]/mx*g;
    s+=`<text x="${L-16}" y="${y+50}" font-size="28" text-anchor="end" font-weight="700" fill="${INK}">${r[0]}</text><rect x="${L}" y="${y+10}" width="${bw}" height="62" rx="8" fill="${i?GOLD:NAVY}"/><text x="${L+bw+12}" y="${y+52}" font-size="32" font-weight="800" fill="${INK}">${fr(r[1]*g,0)}</text><text x="${L}" y="${y+102}" font-size="22" fill="${MUT}">${r[2]}</text>`;});
  return s+"</svg>";
}


// coupe 2D recadrée sur la fosse, grand format
function bigSection(){
  const cs=$("csec"),r=cs.getBoundingClientRect(),x=cs.getContext("2d");cs.width=r.width;cs.height=r.height;
  const {nx,ny,nz,X0,Y0}=M,i=M.iMain,nl=nx*ny;let j0=ny,j1=0;
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)if(M.pb[(k*ny+j)*nx+i]){j0=Math.min(j0,j);j1=Math.max(j1,j);}
  j0=Math.max(0,j0-3);j1=Math.min(ny-1,j1+3);const nj=j1-j0+1,L=70,T=20,cw=(r.width-L-20)/nj,ch=cw,Hs=nz*ch;
  const Y=j=>L+(j-j0)*cw,Z=k=>T+k*ch;x.fillStyle="#f4f6f9";x.fillRect(0,0,r.width,r.height);
  for(let k=0;k<nz;k++)for(let j=j0;j<=j1;j++){const b=(k*ny+j)*nx+i;x.fillStyle=M.mined[b]<=STEP?"#cfe6fb":rgb(M.ore[b]?oreCol(M.g[b]):LITHO[M.lit[b]].c);x.fillRect(Y(j),Z(k),cw+0.6,ch+0.6);}
  x.lineWidth=3.5;
  for(let k=0;k<nz;k++)for(let j=j0;j<=j1;j++){const b=(k*ny+j)*nx+i,p=M.pb[b];
    if(j<j1){const q=M.pb[b+nx];if(p!==q){x.strokeStyle=rgb(PBC[(Math.max(p,q)-1)%6]);x.beginPath();x.moveTo(Y(j+1),Z(k));x.lineTo(Y(j+1),Z(k+1));x.stroke();}}
    if(k<nz-1){const q=M.pb[b+nl];if(p!==q){x.strokeStyle=rgb(PBC[(Math.max(p,q)-1)%6]);x.beginPath();x.moveTo(Y(j),Z(k+1));x.lineTo(Y(j+1),Z(k+1));x.stroke();}}}
  x.strokeStyle="#000";x.lineWidth=5;
  for(let k=0;k<nz;k++)for(let j=j0;j<=j1;j++){const b=(k*ny+j)*nx+i,m=M.mined[b]<=STEP;
    if(j<j1&&m!==(M.mined[b+nx]<=STEP)){x.beginPath();x.moveTo(Y(j+1),Z(k));x.lineTo(Y(j+1),Z(k+1));x.stroke();}
    if(m&&(k===nz-1||M.mined[b+nl]>STEP)){x.beginPath();x.moveTo(Y(j),Z(k+1));x.lineTo(Y(j+1),Z(k+1));x.stroke();}}
  const yS=y=>L+((y-Y0)/15-j0)*cw,zS=z=>T+(-z)/15*ch;
  M.holes.filter(h=>Math.abs(h.xc-(X0+(i+0.5)*15))<=15).forEach(h=>{x.setLineDash([10,7]);x.strokeStyle="#0f172a";x.lineWidth=2.5;x.beginPath();x.moveTo(yS(h.yc),zS(0));x.lineTo(yS(h.yc-h.eoh*h.ca),zS(-h.eoh*h.sa));x.stroke();x.setLineDash([]);
    h.env.forEach(e=>{x.strokeStyle="#0f172a";x.lineWidth=13;x.beginPath();x.moveTo(yS(h.yc-e.from*h.ca),zS(-e.from*h.sa));x.lineTo(yS(h.yc-e.to*h.ca),zS(-e.to*h.sa));x.stroke();x.strokeStyle=rgb(oreCol(e.au));x.lineWidth=8;x.stroke();
      x.font="700 22px system-ui";x.fillStyle="#0f172a";x.fillText(fr(e.au)+" g/t × "+fr(e.tw)+" m",yS(h.yc-e.to*h.ca)+14,zS(-(e.from+e.to)/2*h.sa)+8);});
    x.font="800 24px system-ui";x.fillText(h.h,yS(h.yc)+10,zS(0)+28);});
  x.font="20px system-ui";x.fillStyle="#5b6877";for(let k=0;k<=nz;k+=3)x.fillText("−"+k*15+" m",6,Z(k)+7);
  // légende
  let ly=T+Hs+50;x.font="700 24px system-ui";x.fillStyle="#0f172a";x.fillText("Limites des pushbacks :",L,ly);
  for(let q=0;q<M.npb;q++){x.fillStyle=rgb(PBC[q]);x.fillRect(L+300+q*140,ly-20,40,22);x.fillStyle="#0f172a";x.fillText("PB"+(q+1),L+350+q*140,ly);}
  ly+=46;x.fillStyle="#cfe6fb";x.fillRect(L,ly-20,40,22);x.fillStyle="#0f172a";x.fillText("vide miné",L+50,ly);x.fillStyle="#000";x.fillRect(L+240,ly-12,40,6);x.fillStyle="#0f172a";x.fillText("surface de fosse actuelle",L+290,ly);
  const c=STEP>=0?M.steps[STEP].c:{ot:0,wt:0,oz:0};ly+=60;x.font="800 30px system-ui";x.fillText(STEP>=0?`PB${M.steps[STEP].pb} · banc ${M.steps[STEP].k+1} · minerai ${fr(c.ot/1e6,2)} Mt · SR ${fr(c.ot?c.wt/c.ot:0,1)}`:"Avant exploitation",L,ly);
}

// ---------- scènes ----------
const S=[];let T0=0;const add=(dur,fn)=>{S.push({t0:T0,dur,fn});T0+=dur;};
add(4.5,(lt,p)=>{show("full",1);set("full",`
  <div style="font-size:30px;color:${GOLD};font-weight:800;letter-spacing:3px">KÉDOUGOU · SÉNÉGAL</div>
  <div style="font-size:96px;font-weight:900;line-height:1;margin-top:26px">DIAMBA SUD</div>
  <div style="height:8px;width:${720*seg(p,0.1,0.6)}px;background:${GOLD};margin:34px 0"></div>
  <div style="font-size:44px;font-weight:700;line-height:1.25">Du sondage au cash-flow :<br>lecture d'un ingénieur planification minière</div>
  <div style="font-size:31px;line-height:1.6;margin-top:46px;opacity:${seg(p,0.35,0.7)}">① QAQC · ② statistiques<br>③ modèle de blocs · ④ coupes<br>⑤ pit design & pushbacks<br>⑥ regard du mine planner · ⑦ regard d'économiste</div>
  <div style="position:absolute;left:70px;bottom:90px;font-size:26px;color:#b9c4d4">Serigne Abdou Sankhare · Ingénieur Planification Minière<br>Données publiques Fortuna Mining (forages du 13/10/2026, FS du 29/06/2026)</div>`);});
add(10,(lt,p)=>{show("full",0);use3d(0);useSec(0);band("01 · QAQC","Peut-on faire confiance aux données ?");
  const it=[["✔","RC 5,25'' · split 12,5 % · rejets conservés"],["✔","DD HQ → NQ · demi-carotte sciée"],["✔","ALS Kédougou (prépa) → Ouagadougou (analyse)"],["✔","Fire assay 50 g + AA · gravimétrie si > 10 g/t"],["✔","Blancs, duplicatas, standards insérés"],["✔","Mon contrôle : TW = 0,8 × longueur forée sur tous les trous"],["⚠","RC jusqu'à ~280 m (DSR1149) : risque de contamination"]];
  set("panel",it.map((x,i)=>`<div class="li ${x[0]==="⚠"?"w":""}" style="opacity:${seg(p,0.03+i*0.06,0.1+i*0.06)}"><i>${x[0]}</i><span>${x[1]}</span></div>`).join("")+`<div style="margin-top:26px;opacity:${seg(p,0.45,0.55)}">${barsShare(seg(p,0.45,1))}</div>`);
  set("vcap",`Protocole conforme. Le vrai risque n'est pas le labo : <b>47 % du métal</b> tient dans <b>10 % de la largeur</b> → effet pépite.`);});
add(10,(lt,p)=>{band("02 · STATISTIQUES","Distribution des teneurs & top-cut");
  set("panel",histo(seg(p,0,0.5))+`<div style="margin-top:24px;opacity:${seg(p,0.4,0.5)}">${capChart(seg(p,0.45,1))}</div>`);
  set("vcap",`Distribution log-normale à queue lourde. Les 2 pics à <b>~60 g/t</b> (DSR1128, DSR1132) pilotent la sensibilité : top-cut 20 g/t = <b>−9 %</b> de teneur.`);});
add(12,(lt,p)=>{set("panel","");use3d(1);band("03 · MODÈLE DE BLOCS","Blocs 15 × 15 × 15 m · Southern Arc");
  const legO=ORE.map(o=>`<span class="chip" style="background:${rgb(o.c)}"></span>${o.n.replace("coupure – ","&lt;")}`).join("&nbsp; "),legL=LITHO.map(l=>`<span class="chip" style="background:${rgb(l.c)}"></span>${l.n.split(" ")[0]}`).join("&nbsp; ");
  if(p<0.5){ctl("geo",false,true,"n",0);V.yaw=-1.0+lt*0.11;V.pitch=0.55;V.zoom=1.55;V.px=-40;V.py=60;scene3d("bm1",-1);
    set("vcap",`IDW anisotrope (portées 50/45/12 m) · 7 forages · teneurs écrêtées<div style="font-size:22px;margin-top:10px">${legO}</div>`);}
  else{ctl("geo",true,true,"x",M.iMain);V.yaw=-0.95+(lt-6)*0.04;V.pitch=0.5;V.zoom=1.4;V.px=40;V.py=10;scene3d("bm2",-1);
    set("vcap",`Coupe à DSR1149 : le stérile suit le <b>profil d'altération</b>, le minerai sa propre palette.<div style="font-size:22px;margin-top:10px">${legL}</div>`);}});
add(9,(lt,p)=>{use3d(0);useSec(1);band("04 · COUPE TRANSVERSALE","Section sur DSR1149 · forage, intercepts, pushbacks");
  ctl("geo",true,true,"n",0);const st=Math.round(-1+(M.steps.length*0.75)*seg(p,0.2,0.95));STEP=st;bigSection();
  set("vcap",`Le corps plonge à ~60° : la fosse le suit jusqu'à <b>−270 m</b>. Traits colorés = limites des <b>${M.npb} pushbacks</b>, trait noir = fosse en cours.`);});
add(14,(lt,p)=>{useSec(0);use3d(1);band("05 · PIT DESIGN & PUSHBACKS","Lerchs-Grossmann · 12 coques emboîtées");
  V.zoom=1.05;V.pitch=0.62;V.px=0;V.py=20;V.yaw=-0.75+lt*0.025;
  if(lt<3){ctl("pb",true,true,"n",0);scene3d("pb",-1);set("vcap",`Coques à facteur de revenu 0,20 → 1,00 regroupées en <b>${M.npb} pushbacks</b> de tonnage équivalent.<div style="font-size:22px;margin-top:10px">${Array.from({length:M.npb},(_,q)=>`<span class="chip" style="background:${rgb(PBC[q])}"></span>PB${q+1}`).join("&nbsp;&nbsp;")}</div>`);}
  else{ctl("geo",true,true,"n",0);const st=Math.min(M.steps.length-1,Math.floor((M.steps.length)*seg((lt-3)/10.5,0,1)));scene3d("geo",st);
    const s=M.steps[Math.max(0,st)],c=s.c;set("vcap",`<b>PB${s.pb}</b> · banc ${s.k+1} (−${(s.k+1)*15} m) · année ~${fr((c.ot+c.wt)/1e6/25,1)}<br>Minerai ${fr(c.ot/1e6,2)} Mt à ${fr(c.oz*31.1035/c.ot,2)} g/t · ${fr(c.oz/1e3,0)} koz · SR ${fr(c.wt/c.ot,1)}`);}});
add(11,(lt,p)=>{use3d(0);band("06 · REGARD DU MINE PLANNER","Où se cache le coût ?");
  const F=M.steps[M.steps.length-1].c;
  set("panel",pbChart(seg(p,0,0.55))+`<div style="margin-top:22px">`+[
    ["▸",`L'or profond coûte cher : SR de <b>${fr(M.steps.filter(s=>s.pb===1).reduce((a,s)=>a+s.wt,0)/M.steps.filter(s=>s.pb===1).reduce((a,s)=>a+s.ot,0),1)}</b> (PB1) à <b>${fr(M.steps.filter(s=>s.pb===M.npb).reduce((a,s)=>a+s.wt,0)/M.steps.filter(s=>s.pb===M.npb).reduce((a,s)=>a+s.ot,0),1)}</b> (PB${M.npb})`],
    ["▸","FS : 130 Mt de stérile / 9,4 ans → <b>~16 Mt/an</b> : flotte dimensionnée sur la pointe de découverture"],
    ["▸","7 fosses + mélange oxyde/frais (2,5 vs 2,0 Mt/an) : la limite d'altération pilote l'usine"],
    ["▸",`Calage : mon modèle ${fr(F.ot/1e6,2)} Mt à ${fr(F.oz*31.1035/F.ot,2)} g/t vs ressource Fortuna <b>6,0 Mt à 1,91 g/t</b>`]
  ].map((x,i)=>`<div class="li" style="font-size:27px;margin-bottom:12px;opacity:${seg(p,0.5+i*0.08,0.58+i*0.08)}"><i style="color:${NAVY}">${x[0]}</i><span>${x[1]}</span></div>`).join("")+`</div>`);
  set("vcap",`Séquencer d'abord le métal superficiel (DSDD799, DSR1132), garder le profond en <b>pushback optionnel</b> au prix de réserve.`);});
add(13,(lt,p)=>{band("07 · REGARD D'ÉCONOMISTE","Ce que vaut le projet");
  const k=[["397,5 M$","CAPEX initial"],["1 009 M$","VAN5 après impôt"],["60 %","TRI après impôt"],["1 332 $/oz","AISC moyen LoM"],["2 168 $/oz","marge à 3 500 $/oz"],["158 koz/an","4 premières années"]];
  set("panel",`<div class="kp">${k.map((x,i)=>`<div style="opacity:${seg(p,0.02+i*0.04,0.1+i*0.04)}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div><div style="margin-top:28px;opacity:${seg(p,0.3,0.38)}">${npvChart(seg(p,0.3,0.75))}</div>`+
    [["▸","<b>≈ 0,56 M$ de VAN par $/oz</b> : le projet est un levier sur le prix de l'or"],["▸","Valeur concentrée sur les 4 premières années (AISC 1 056 $/oz)"],["⚠","Risque n°1 : <b>permis d'exploitation</b> (déposé le 04/02/2026) · État 10 % gratuit"],["▸","Upside : Southern Arc ouvert + Kabewest à 2,3 km de l'usine"]]
    .map((x,i)=>`<div class="li ${x[0]==="⚠"?"w":""}" style="font-size:26px;margin-bottom:10px;opacity:${seg(p,0.62+i*0.07,0.7+i*0.07)}"><i style="color:${x[0]==="⚠"?"#d97706":NAVY}">${x[0]}</i><span>${x[1]}</span></div>`).join(""));
  set("vcap",`Projet robuste et rapide à rembourser, mais <b>7 fosses à 1,75 g/t</b> : la réconciliation et le séquençage feront la différence.`);});
add(7,(lt,p)=>{show("full",1);set("full",`
  <div style="font-size:30px;color:${GOLD};font-weight:800;letter-spacing:3px">EN RÉSUMÉ</div>
  <div style="font-size:44px;font-weight:800;line-height:1.3;margin-top:30px">Données saines, or pépitique,<br>fosse profonde coûteuse,<br>économie très sensible au prix.</div>
  <div style="height:6px;width:620px;background:${GOLD};margin:44px 0"></div>
  <div style="font-size:32px;line-height:1.5;opacity:${seg(p,0.2,0.5)}">Et vous : quel risque pèse le plus sur Diamba Sud ?<br><b style="color:${GOLD}">permis · pépite · prix de l'or</b></div>
  <div style="position:absolute;left:70px;right:70px;bottom:90px;font-size:22px;line-height:1.5;color:#b9c4d4">Modèle conceptuel construit à partir d'informations publiques (collets hypothétiques) — ni ressource ni réserve au sens NI 43-101. Outils : HTML offline + Python, optimisation Lerchs-Grossmann.<br><span style="color:#fff">Serigne Abdou Sankhare · Ingénieur Planification Minière</span></div>`);});
window.TOTAL=T0;
window.renderFrame=function(t){
  const sc=S.find(s=>t>=s.t0&&t<s.t0+s.dur)||S[S.length-1],lt=Math.min(t-sc.t0,sc.dur-1e-6),p=lt/sc.dur;
  show("full",0);show("panel",1);
  sc.fn(lt,p);
  const fade=0.35,v=Math.max(0,1-lt/fade,1-(sc.dur-lt)/fade);
  $("veil").style.opacity=(sc===S[0]&&lt<fade)?0:Math.min(1,v).toFixed(3);
  const isFull=$("full").style.display!=="none";$("sig").style.display=isFull?"none":"";
};
})();
