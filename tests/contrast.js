'use strict';
/* Z4a: контраст подписей под плитками, число (WCAG), худшая точка. Цель ≥ 4,5:1. node tests/contrast.js
   Светлая тема и «параллельный мир». Два снимка одной и той же страницы: подписи видны и подписи прозрачные.
   Пиксели подписи — те, что различаются между снимками (координаты вычислять не нужно); фон под ними — из второго снимка.
   Для каждого такого пикселя считаем контраст цвета подписи с фоном и берём самый плохой.
   «Было» — прежняя схема: подпись внутри плитки с opacity .6 (цвет подписи смешан с фоном 60/40). */
const fs=require('fs'),path=require('path'),zlib=require('zlib'),os=require('os');
const {serve,chrome}=require('./lib');

function png(buf){
  let p=8,w=0,h=0,ct=0,idat=[];
  while(p<buf.length){const len=buf.readUInt32BE(p),type=buf.toString('ascii',p+4,p+8),d=buf.slice(p+8,p+8+len);
    if(type==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);if(d[8]!==8)throw new Error('нужен 8 бит');ct=d[9]}
    if(type==='IDAT')idat.push(d);p+=12+len}
  const bpp=ct===6?4:3,raw=zlib.inflateSync(Buffer.concat(idat)),stride=w*bpp,px=Buffer.alloc(h*stride);
  for(let y=0;y<h;y++){
    const f=raw[y*(stride+1)],src=raw.slice(y*(stride+1)+1,(y+1)*(stride+1)),dst=px.slice(y*stride,(y+1)*stride),prev=y?px.slice((y-1)*stride,y*stride):Buffer.alloc(stride);
    for(let i=0;i<stride;i++){
      const a=i>=bpp?dst[i-bpp]:0,b=prev[i],c=i>=bpp?prev[i-bpp]:0;let v=src[i];
      if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;
      else if(f===4){const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c)}
      dst[i]=v&255}}
  return {w,h,bpp,px};
}
const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
const lum=(r,g,b)=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const ratio=(a,b)=>(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
const rgb=s=>{const m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s);return [+m[1],+m[2],+m[3]]};

async function shotRun(mode,bg){
  const s=await serve(),file=path.join(os.tmpdir(),'zv-contrast-'+mode+(bg?'-bg':'')+'.png');
  try{fs.unlinkSync(file)}catch(e){}
  const c=chrome('http://127.0.0.1:'+s.port+'/index.html#sa-test&run=contrast&mode='+mode+'&bg='+(bg?1:0),
    ['--screenshot='+file,'--window-size=375,3000','--virtual-time-budget=6000','--hide-scrollbars']);
  const tm=new Promise(r=>setTimeout(()=>r({error:'таймаут'}),60000));
  try{
    const rep=await Promise.race([s.report,tm]);
    if(rep.error||!rep.ok)throw new Error(rep.error);
    await new Promise(res=>{const t=setInterval(()=>{if(fs.existsSync(file)&&fs.statSync(file).size>1000){clearInterval(t);setTimeout(res,500)}},300);setTimeout(()=>{clearInterval(t);res()},30000)});
    return {rep,img:png(fs.readFileSync(file))};
  }finally{c.stop();s.server.close()}
}

(async()=>{
  const rows=[];let bad=0;
  for(const mode of ['light','world']){
    const vis=await shotRun(mode,false),bg=await shotRun(mode,true);
    const A=vis.img,B=bg.img;
    if(A.w!==B.w||A.h!==B.h)throw new Error('снимки разного размера');
    const col=rgb(vis.rep.labels[0].color),lt=lum(col[0],col[1],col[2]);
    let n=0,worst=99,worstOld=99,wp=null,minY=1e9,maxY=0;
    for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){
      const oa=(y*A.w+x)*A.bpp,ob=(y*B.w+x)*B.bpp;
      const dr=A.px[oa]-B.px[ob],dg=A.px[oa+1]-B.px[ob+1],db=A.px[oa+2]-B.px[ob+2];
      if(Math.abs(dr)+Math.abs(dg)+Math.abs(db)<24)continue;
      /* пиксель подписи: цвет между фоном и цветом подписи, без выбросов (анимация фона и другие отличия не считаются) */
      const r=B.px[ob],g=B.px[ob+1],b=B.px[ob+2];
      const inb=(v,p,q)=>v>=Math.min(p,q)-3&&v<=Math.max(p,q)+3;
      if(!(inb(A.px[oa],r,col[0])&&inb(A.px[oa+1],g,col[1])&&inb(A.px[oa+2],b,col[2])))continue;
      const lb=lum(r,g,b),q=ratio(lt,lb);n++;minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      if(q<worst){worst=q;wp=[x,y,r,g,b]}
      const er=col[0]*0.6+r*0.4,eg=col[1]*0.6+g*0.4,eb=col[2]*0.6+b*0.4;
      worstOld=Math.min(worstOld,ratio(lum(er,eg,eb),lb));
    }
    rows.push({mode,n,worst,worstOld,wp,eff:Math.min.apply(null,vis.rep.effOpacity),color:vis.rep.labels[0].color,y:[minY,maxY]});
    if(process.env.DBG)console.error(mode,JSON.stringify(rows[rows.length-1]));
    if(n<200)throw new Error('пикселей подписей слишком мало: '+n+' ('+mode+') — снимки не совпали');
    if(worst<4.5)bad++;
  }
  /* строка «Звучит»: по вычисленным стилям, обе темы */
  const {run}=require('./lib');
  const nowRows=[];let nowBad=0;
  for(const mode of ['light','world']){
    const r=await run('contrast&now=1&mode='+mode,90000,['--window-size=500,900']);
    if(!r.ok)throw new Error('now '+mode+': '+r.error);
    r.now.forEach(x=>{nowRows.push([mode,x]);if(x.ratio<4.5)nowBad++});
  }
  console.log('| Тема | Пикселей подписи | Цвет подписи | Мин. непрозрачность | Было (opacity .6), худшая точка | Стало, худшая точка |');
  console.log('|---|---|---|---|---|---|');
  rows.forEach(r=>console.log('| '+(r.mode==='light'?'светлая':'«параллельный мир»')+' | '+r.n+' | '+r.color+' | '+r.eff.toFixed(2)+' | '+r.worstOld.toFixed(2)+':1 | **'+r.worst.toFixed(2)+':1** |'));
  console.log('\nСтрока «Звучит»: контраст текста с фоном под ним (вычисленные стили)');
  console.log('| Тема | Элемент | Текст | Фон | Контраст |');
  console.log('|---|---|---|---|---|');
  nowRows.forEach(([m,x])=>console.log('| '+(m==='light'?'светлая':'«параллельный мир»')+' | '+x.name+' | '+x.text+' | '+x.bg+' | **'+x.ratio.toFixed(2)+':1** |'));
  console.log('\nЦель ≥ 4,5:1: '+(bad||nowBad?'НЕ выполнена':'выполнена'));
  process.exit(bad||nowBad?1:0);
})().catch(e=>{console.error('ОШИБКА:',e.message);process.exit(2)});
