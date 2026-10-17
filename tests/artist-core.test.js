'use strict';
/* Тесты ядра «Художника звука». Берёт код между маркерами SA-CORE-BEGIN и SA-CORE-END прямо из index.html. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const a0=html.indexOf('/*SA-CORE-BEGIN*/'),b0=html.indexOf('/*SA-CORE-END*/');
assert(a0>0&&b0>a0,'не найдены маркеры ядра');
const core=new Function(html.slice(a0,b0)+'; return {ARTIST,saRng,saCanvas,saClear,saStamp,saSpray,saSnapshot,saUpper,saSampleCanvas,saSampleFog,saEcho,saPlan,saPreset,SA_PRESETS,saDot,saBrush};')();
const {saBrush,ARTIST,saRng,saCanvas,saStamp,saSnapshot,saUpper,saSampleCanvas,saPlan,saPreset,SA_PRESETS,saDot,saSpray}=core;

let pass=0,fail=0;
function t(name,fn){try{fn();pass++;console.log('  ✓',name)}catch(e){fail++;console.log('  ✗',name,'\n     ',e.message)}}

console.log('генератор');
t('одинаковый seed → одинаковая последовательность',()=>{const x=saRng(5),y=saRng(5);for(let i=0;i<1000;i++)assert.strictEqual(x.u32(),y.u32())});
t('разные seed → разные последовательности',()=>assert.notStrictEqual(saRng(1).u32(),saRng(2).u32()));
t('unit() в [0,1)',()=>{const r=saRng(9);for(let i=0;i<1e5;i++){const u=r.unit();assert(u>=0&&u<1)}});
t('gauss(): среднее ≈ 0, σ ≈ 1',()=>{const r=saRng(3);let s=0,q=0,n=2e5;for(let i=0;i<n;i++){const g=r.gauss();s+=g;q+=g*g}assert(Math.abs(s/n)<0.01);assert(Math.abs(Math.sqrt(q/n)-1)<0.01)});

console.log('холст и слепок');
t('пустой холст: total=0, entropy=0',()=>{const s=saSnapshot(saCanvas());assert.strictEqual(s.total,0);assert.strictEqual(s.entropy,0)});
t('порог ε: невидимая краска обнуляется',()=>{
  const cv=saCanvas();cv.d[10]=60000;cv.d[20]=100;
  assert.strictEqual(saSnapshot(cv).total,60000);
});
t('краска чуть выше порога остаётся',()=>{const cv=saCanvas();cv.d[10]=60000;cv.d[20]=300;assert.strictEqual(saSnapshot(cv).total,60300)});
t('накопленные суммы не убывают',()=>{
  const cv=saCanvas();saPreset(cv,'cloud');const c=saSnapshot(cv).cdf;
  for(let i=1;i<c.length;i++)assert(c[i]>=c[i-1]);
});
t('предел густоты: D1 = min(D+d, Dmax)',()=>{
  const cv=saCanvas();for(let i=0;i<20;i++)saStamp(cv,50,20,2,2,60000,0,'pen');
  let m=0;cv.d.forEach(v=>{if(v>m)m=v});assert.strictEqual(m,ARTIST.dMax);
});
t('смешивание цвета по весу краски',()=>{
  const cv=saCanvas();saStamp(cv,10.5,10.5,0.6,0.6,1000,-1,'pen');saStamp(cv,10.5,10.5,0.6,0.6,1000,1,'pen');
  assert.strictEqual(cv.p[10*cv.w+10],0);
});
t('пёстрое пятно остаётся пёстрым (клетки разных цветов)',()=>{
  const cv=saCanvas();saSpray(cv,100,32,10,10,5000,[-1,0,1],400,saRng(1));
  const set=new Set();for(let i=0;i<cv.d.length;i++)if(cv.d[i])set.add(Math.sign(cv.p[i]));
  assert.strictEqual(set.size,3);
});
t('ластик уменьшает густоту, цвет не трогает',()=>{
  const cv=saCanvas();saStamp(cv,10.5,10.5,0.6,0.6,1000,0.5,'pen');const p0=cv.p[10*cv.w+10];
  saStamp(cv,10.5,10.5,0.6,0.6,0.5,0,'erase');assert.strictEqual(cv.d[10*cv.w+10],500);assert.strictEqual(cv.p[10*cv.w+10],p0);
});
t('энтропия: точка пером ≈ 0, ровная заливка = 1',()=>{
  const c1=saCanvas();c1.d[500]=30000;assert(saSnapshot(c1).entropy<1e-9);
  const c2=saCanvas();c2.d.fill(1000);assert(Math.abs(saSnapshot(c2).entropy-1)<1e-9);
});
t('энтропия растёт: пинг-понг < облако',()=>{
  const a=saCanvas(),b=saCanvas();saPreset(a,'pingpong');saPreset(b,'cloud');
  assert(saSnapshot(a).entropy<saSnapshot(b).entropy);
});

console.log('выборка');
t('saUpper: границы',()=>{const c=Uint32Array.from([0,0,5,5,9]);assert.strictEqual(saUpper(c,0),2);assert.strictEqual(saUpper(c,4),2);assert.strictEqual(saUpper(c,5),4);assert.strictEqual(saUpper(c,8),4)});
t('две клетки с весами 1:3, 10^6 выборок — хи-квадрат',()=>{
  const cv=saCanvas();cv.d[100]=10000;cv.d[200]=30000;const s=saSnapshot(cv),r=saRng(42),N=1e6,w=cv.w;
  let n1=0,n2=0,other=0;
  for(let i=0;i<N;i++){const p=saSampleCanvas(s,r,0),idx=Math.floor(p.y*s.h)*w+Math.floor(p.x*w);if(idx===100)n1++;else if(idx===200)n2++;else other++}
  assert.strictEqual(other,0);
  const e1=N*0.25,e2=N*0.75,chi=(n1-e1)**2/e1+(n2-e2)**2/e2;
  console.log('      доли:',(n1/N).toFixed(4),(n2/N).toFixed(4),' хи-квадрат =',chi.toFixed(2),'(порог 10,83 при p=0,001)');
  assert(chi<10.83);
});
t('точка попадает внутрь своей клетки (дрожание)',()=>{
  const cv=saCanvas();cv.d[cv.w*3+7]=1000;const s=saSnapshot(cv),r=saRng(1);
  for(let i=0;i<1000;i++){const p=saSampleCanvas(s,r,0);assert(p.x>=7/cv.w&&p.x<8/cv.w);assert(p.y>=3/cv.h&&p.y<4/cv.h)}
});
t('цвет клетки доходит до эха',()=>{
  const cv=saCanvas();saStamp(cv,100.5,32.5,0.6,0.6,5000,-1,'pen');const s=saSnapshot(cv);
  assert.strictEqual(saSampleCanvas(s,saRng(1),0).pan,-1);
});
t('размытие: разброс растёт',()=>{
  const cv=saCanvas();saStamp(cv,128.5,32.5,0.6,0.6,5000,0,'pen');const s=saSnapshot(cv);
  const sd=bl=>{const r=saRng(7),xs=[];for(let i=0;i<20000;i++)xs.push(saSampleCanvas(s,r,bl).x);const m=xs.reduce((a,b)=>a+b)/xs.length;return Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0)/xs.length)};
  assert(sd(0.1)>sd(0)*5);
});

console.log('план эх');
t('точка пером на 0,25 с у горизонта, белая → эхо ≈ 0,25 с, по центру, почти без сдвига тона',()=>{
  const cv=saCanvas();saDot(cv,0.25/ARTIST.maxTime,0.5,0.001,30000,0,'pen');
  const p=saPlan(saSnapshot(cv),11,{influence:1});
  assert(p.length>0);
  p.forEach(e=>{assert(Math.abs(e.t-0.25)<0.03,'t='+e.t);assert.strictEqual(e.pan,0);assert(Math.abs(e.semis)<1,'semis='+e.semis)});
});
t('та же точка голубым выше горизонта → эхо слева и выше по тону',()=>{
  const cv=saCanvas();saDot(cv,0.1,0.2,0.001,30000,-1,'pen');
  saPlan(saSnapshot(cv),3,{influence:1}).forEach(e=>{assert.strictEqual(e.pan,-1);assert(e.semis>5);assert(e.bright>0)});
});
t('ниже горизонта → ниже и глуше',()=>{
  const cv=saCanvas();saDot(cv,0.1,0.8,0.001,30000,0,'pen');
  saPlan(saSnapshot(cv),3,{influence:1}).forEach(e=>{assert(e.semis<-5);assert(e.bright<0)});
});
t('пустой холст при influence=1: эха нет',()=>assert.strictEqual(saPlan(saSnapshot(saCanvas()),1,{influence:1}).length,0));
t('пустой холст при influence=0: только «туман» у горизонта',()=>{
  const p=saPlan(saSnapshot(saCanvas()),1,{influence:0});assert.strictEqual(p.length,ARTIST.taps);
  p.forEach(e=>{assert.strictEqual(e.src,'f');assert.strictEqual(e.pan,0);assert(Math.abs(e.semis)<ARTIST.semis*0.6)});
});
t('influence=0.5: примерно половина с холста',()=>{
  const cv=saCanvas();saPreset(cv,'pingpong');const s=saSnapshot(cv);let c=0,n=0;
  for(let seed=1;seed<=400;seed++)saPlan(s,seed,{influence:0.5}).forEach(e=>{n++;if(e.src==='c')c++});
  assert(Math.abs(c/n-0.5)<0.03,'доля '+(c/n));
});
t('детерминизм: seed + холст → тот же план',()=>{
  const cv=saCanvas();saPreset(cv,'rain');const s=saSnapshot(cv);
  assert.deepStrictEqual(saPlan(s,99,{influence:0.8,blur:0.05}),saPlan(s,99,{influence:0.8,blur:0.05}));
});
t('другой seed → другой план',()=>{
  const cv=saCanvas();saPreset(cv,'rain');const s=saSnapshot(cv);
  assert.notDeepStrictEqual(saPlan(s,1,{influence:1}),saPlan(s,2,{influence:1}));
});
t('все эха внутри осей, суммарная громкость не выше потолка',()=>{
  SA_PRESETS.forEach(name=>{
    const cv=saCanvas();saPreset(cv,name);const s=saSnapshot(cv);
    for(let seed=1;seed<=50;seed++){
      const p=saPlan(s,seed,{influence:1,blur:0.2});let sum=0;
      p.forEach(e=>{assert(e.t>=0&&e.t<ARTIST.maxTime);assert(Math.abs(e.semis)<=ARTIST.semis);assert(e.pan>=-1&&e.pan<=1);assert(e.gain>0);sum+=e.gain**2});
      assert(Math.sqrt(sum)<=ARTIST.loud+1e-9,name+' громкость '+Math.sqrt(sum));
    }
  });
});
t('план отсортирован по времени',()=>{const cv=saCanvas();saPreset(cv,'rain');const p=saPlan(saSnapshot(cv),5,{influence:1});for(let i=1;i<p.length;i++)assert(p[i].t>=p[i-1].t)});

console.log('пресеты');
SA_PRESETS.forEach(name=>t('«'+name+'»: непустой, детерминирован',()=>{
  const a=saCanvas(),b=saCanvas();saPreset(a,name);saPreset(b,name);
  assert(saSnapshot(a).total>0);assert.deepStrictEqual(a.d,b.d);assert.deepStrictEqual(a.p,b.p);
}));
t('«Классика»: эхо в 0,28·k с',()=>{
  const cv=saCanvas();saPreset(cv,'classic');const p=saPlan(saSnapshot(cv),4,{influence:1,taps:400});
  p.forEach(e=>{const k=Math.round(e.t/0.28);assert(k>=1&&k<=8&&Math.abs(e.t-0.28*k)<0.06,'t='+e.t)});
});
t('«Пинг-понг»: чередуются левое и правое',()=>{
  const cv=saCanvas();saPreset(cv,'pingpong');const p=saPlan(saSnapshot(cv),4,{influence:1,taps:200});
  p.forEach(e=>{const k=Math.round(e.t/0.25);assert.strictEqual(e.pan,k%2?-1:1,'t='+e.t)});
});
t('быстродействие: 10^6 выборок',()=>{
  const cv=saCanvas();saPreset(cv,'cloud');const s=saSnapshot(cv),r=saRng(1);const t0=process.hrtime.bigint();
  for(let i=0;i<1e6;i++)saSampleCanvas(s,r,0.02);
  const ms=Number(process.hrtime.bigint()-t0)/1e6;console.log('      ',ms.toFixed(0),'мс на 10^6 выборок');assert(ms<1500);
});
t('пересборка слепка < 5 мс',()=>{
  const cv=saCanvas();saPreset(cv,'cloud');const t0=process.hrtime.bigint();for(let i=0;i<20;i++)saSnapshot(cv);
  const ms=Number(process.hrtime.bigint()-t0)/1e6/20;console.log('      ',ms.toFixed(2),'мс');assert(ms<5);
});

console.log('кисти эффектов');
t('нет эффектов: нейтральная кисть',()=>{const b=saBrush({});assert.strictEqual(b.thick,1);assert.strictEqual(b.wobble.length,0);assert.strictEqual(b.echo,null)});
t('Слон толще и ниже, Мышка тоньше и выше (от скорости проигрыша)',()=>{const e=saBrush({low:1}),m=saBrush({high:1});assert(e.rate<1&&e.thick>1);assert(m.rate>1&&m.thick<1);assert(e.thick>saBrush({low:0.25}).thick)});
t('Варп и НЛО качают ленту на реальных 2,5 и 7 Гц',()=>{const b=saBrush({warp:0.5,ufo:1});assert.deepStrictEqual(b.wobble.map(w=>w.hz),[2.5,7]);assert.strictEqual(b.wobble[0].amp,0.175);assert.strictEqual(b.wobble[1].amp,0.3)});
t('Эхо: задержка 0,28 с и обратная связь как в build()',()=>{const b=saBrush({echo:1});assert.strictEqual(b.echo.delay,0.28);assert(Math.abs(b.echo.fb-0.6)<1e-9);assert(Math.abs(b.echo.mix-0.8)<1e-9)});
t('Замок: свечение растёт с силой, длина хвоста как у реверберации',()=>{const a=saBrush({cave:0.25}),c=saBrush({cave:1});assert(c.glow>a.glow);assert(Math.abs(c.cave.len-3.5)<1e-9)});
t('Ретро: ступеньки 3/6/12 как у crush(), квадратные пиксели',()=>{assert.deepStrictEqual([0.25,0.5,1].map(s=>saBrush({retro:s}).grid),[3,6,12]);assert(saBrush({retro:1}).square)});
t('Вертолёт: толщина пульсирует на 9 Гц (не яркость)',()=>{const p=saBrush({trem:1}).pulse;assert.strictEqual(p.hz,9);assert.strictEqual(p.amp,0.5)});
t('Хор: три копии с задержками 16/24/32 мс',()=>assert.deepStrictEqual(saBrush({chorus:1}).copies,[0.016,0.024,0.032]));
t('Попугай: кусочки по 0,12 с',()=>assert.strictEqual(saBrush({parrot:1}).dash,0.12));
t('Задом наперёд: кусочки 0,22 / 0,6 с / целиком, цвета перевёрнуты',()=>{assert.deepStrictEqual([0.25,0.5,1].map(s=>saBrush({rev:s}).revChunk),[0.22,0.6,0]);assert(saBrush({rev:1}).hueFlip)});
t('Рация и Под водой обесцвечивают краску, вода размывает',()=>{assert(saBrush({radio:1}).sat<40);const w=saBrush({water:1});assert(w.sat<92&&w.blur>0)});
t('Рок: зазубрины тем сильнее, чем сильнее эффект',()=>assert(saBrush({rock:1}).zig>saBrush({rock:0.25}).zig));

console.log('\nИтого: ✓',pass,' ✗',fail);
process.exit(fail?1:0);
