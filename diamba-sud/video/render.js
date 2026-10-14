// Rendu image par image de la vidéo LinkedIn Diamba Sud.
// Usage : node render.js <dossier_frames> [fps] [--preview t1,t2,...]
const {chromium}=require("playwright");
const path=require("path"),fs=require("fs");
(async()=>{
  const out=process.argv[2],fps=+(process.argv[3]||30),prev=process.argv.indexOf("--preview");
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
  p.on("pageerror",e=>console.error("PAGEERR",e.message));
  await p.goto("file://"+path.resolve(__dirname,"../Diamba_Sud_Fosse_3D_Pushbacks.html"));
  await p.waitForFunction(()=>document.getElementById("busy").style.display==="none",{timeout:120000});
  await p.addScriptTag({path:path.resolve(__dirname,"scenes.js")});
  await p.evaluate(()=>{resize();});
  const total=await p.evaluate(()=>TOTAL);
  const times=prev>0?process.argv[prev+1].split(",").map(Number):Array.from({length:Math.ceil(total*fps)},(_,i)=>i/fps);
  console.log("durée",total,"s ·",times.length,"images");
  for(let i=0;i<times.length;i++){
    await p.evaluate(t=>renderFrame(t),times[i]);
    await p.screenshot({path:path.join(out,(prev>0?"prev_":"")+String(i).padStart(5,"0")+".jpg"),type:"jpeg",quality:92});
    if(i%150===0)console.log(i);
  }
  await b.close();
})();
