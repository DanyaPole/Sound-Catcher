/* Нарезка ✂️ до и после эффектов и 8 новых эффектов. #sa-test&run=slices (фрейм 375×812) */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)+':'+ab.length}
  function freq(ab,t0,t1,ch){
    var d=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.max(1,Math.round(t0*sr)),b=Math.min(d.length,Math.round(t1*sr)),first=-1,last=-1,n=0,i;
    for(i=a;i<b;i++)if(d[i-1]<0&&d[i]>=0){var x=i-1+(-d[i-1])/(d[i]-d[i-1]);if(first<0)first=x;else n++;last=x}
    return n?n/((last-first)/sr):0;
  }
  /* амплитуда частоты f в отрезке (Гёрцель) */
  function gz(ab,t0,t1,f,ch){
    var d=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.round(t0*sr),b=Math.min(d.length,Math.round(t1*sr)),w=2*Math.cos(2*Math.PI*f/sr),s1=0,s2=0,i;
    for(i=a;i<b;i++){var s=d[i]+w*s1-s2;s2=s1;s1=s}
    return Math.sqrt(Math.max(0,s1*s1+s2*s2-w*s1*s2))*2/(b-a);
  }
  function rms(ab,t0,t1,ch){var d=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.round(t0*sr),b=Math.min(d.length,Math.round(t1*sr)),e=0,i;for(i=a;i<b;i++)e+=d[i]*d[i];return Math.sqrt(e/Math.max(1,b-a))}
  function peak(ab){var m=0,c,i;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c);for(i=0;i<d.length;i++){var v=Math.abs(d[i]);if(!(v<=m))m=isFinite(v)?v:1e9}}return m}
  function near(f,want,tol){return Math.abs(f/want-1)<(tol||0.015)}
  function ptr(type,el,x,y){el.dispatchEvent(new W.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:5,pointerType:'touch',isPrimary:true}))}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,SL=T.slices,P=T.player,sr=44100,i;
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;

    /* ровный тон Ля 1,2 с */
    var len=Math.round(sr*1.2),A=new Float32Array(len);
    for(i=0;i<len;i++){var e=Math.min(1,i/441,(len-1-i)/441);A[i]=0.5*e*Math.sin(2*Math.PI*440*i/sr)}
    T.load([A],sr);T.ui();await sleep(200);
    var NEW=['pan','flange','phaser','tape','slow','ring','space','wah'];
    check('S1 24 плитки, новые на месте',D.querySelectorAll('#grid .t').length===24&&NEW.every(function(id){return D.querySelector('#grid .t[data-id='+id+']')}),D.querySelectorAll('#grid .t').length+' плиток');

    T.fx([]);var orig=await T.render(),h0=hash(orig),bad=[];
    for(var q=0;q<NEW.length;q++){
      T.fx([[NEW[q],3]]);var rb=await T.render(),pk=peak(rb);
      if(!(pk>0.05&&pk<=1.0001)||hash(rb)===h0)bad.push(NEW[q]+' '+pk.toFixed(3));
    }
    check('S2 все 8 новых звучат, иначе чем было, без перегруза',!bad.length,bad.join(', ')||'ок');

    T.fx([['slow',3]]);var sb=T.slices.src(),sl=await T.render();
    check('S3 🐌 Улитка: вдвое длиннее, высота та же',Math.abs(sb.length/len-2)<0.01&&near(freq(sl,0.6,1.8),440,0.01),(sb.length/len).toFixed(3)+'× · '+freq(sl,0.6,1.8).toFixed(1)+' Гц');

    T.fx([['ring',3]]);var rg=await T.render(),f2=300+260,side=gz(rg,0.2,1,440+f2),base=gz(orig,0.2,1,440+f2);
    check('S4 🔔 Колокол: появились новые ноты (440+560 Гц)',side>0.05&&base<0.01,side.toFixed(3)+' (было '+base.toFixed(4)+')');

    T.fx([['pan',3]]);var pn=await T.render(),dl=[];
    for(i=0;i<8;i++){var t=0.1+i*0.12;dl.push(rms(pn,t,t+0.06,0)-rms(pn,t,t+0.06,1))}
    check('S5 🌪️ Вихрь: стерео, звук то левее, то правее',pn.numberOfChannels===2&&Math.max.apply(null,dl)>0.05&&Math.min.apply(null,dl)<-0.05,dl.map(function(v){return v.toFixed(2)}).join(' '));

    T.fx([['space',3]]);var spc=await T.render(),oct=T.slices.octave();
    check('S6 🌌 Космос: октава выше той же длины, долгий хвост',near(freq(oct,0.3,0.9),880,0.01)&&oct.length===len&&spc.duration>1.2+4&&rms(spc,1.5,2.5)>0.01,freq(oct,0.3,0.9).toFixed(1)+' Гц · '+spc.duration.toFixed(2)+' с · хвост '+rms(spc,1.5,2.5).toFixed(3));

    T.fx([['tape',3]]);var tp=await T.render(),fs=[];
    for(i=0;i<9;i++)fs.push(freq(tp,0.1+i*0.11,0.2+i*0.11));
    var spread=(Math.max.apply(null,fs)-Math.min.apply(null,fs))/440;
    check('S7 📼 Кассета: высота плывёт',spread>0.004&&spread<0.08,(spread*100).toFixed(2)+'%');
    T.fx([]);

    /* четыре ноты по 0,3 с: 300, 400, 500, 600 Гц */
    var L4=Math.round(sr*1.2),Q=new Float32Array(L4),FQ=[300,400,500,600];
    for(i=0;i<L4;i++){var k=Math.min(3,Math.floor(i/(L4/4)));Q[i]=0.5*Math.sin(2*Math.PI*FQ[k]*i/sr)}
    T.load([Q],sr);var q0=await T.render(),hq=hash(q0);
    SL.set({n:4,mode:'pre',order:[3,2,1,0],rev:[false,false,false,false]});
    var q1=await T.render(),fq=[0,1,2,3].map(function(j){return freq(q1,j*0.3+0.05,j*0.3+0.25)});
    check('S8 ✂️ до эффектов: кусочки 4-3-2-1 звучат наоборот',near(fq[0],600)&&near(fq[1],500)&&near(fq[2],400)&&near(fq[3],300)&&q1.length===q0.length,fq.map(function(v){return v.toFixed(0)}).join(' · '));
    SL.set({order:[0,1,2,3],rev:[false,true,false,false]});
    var sb2=SL.src(),d2=sb2.getChannelData(0),QB=SL.bounds(T.slices.src()),s0=QB[1],e0=QB[2],mid=Math.round((s0+e0)/2),ok=true;
    /* кусочки теперь по доле звука, а не по времени — границы берём у приложения; слот 1 — кусочек 1 задом наперёд */
    for(i=-50;i<50;i++)if(Math.abs(d2[mid+i]-Q[s0+e0-1-(mid+i)])>1e-6)ok=false;
    check('S9 ✂️ кусочек задом наперёд',ok&&SL.state().on,'');
    SL.set({order:[0,1,2,3],rev:[false,false,false,false]});
    var q2=await T.render();
    check('S10 ↺ по порядку — бит в бит как было',hash(q2)===hq&&!SL.state().on,hash(q2)+' / '+hq);

    /* после эффектов: эхо Слона, хвосты режутся вместе с кусочками */
    T.fx([['echo',3]]);
    SL.set({n:4,mode:'post',order:[3,2,1,0],rev:[false,false,false,false]});
    var pb=await SL.post(),raw=SL.raw(),RR=SL.range(raw),RBD=SL.bounds(raw),n4=RBD[1]-RBD[0],okp=pb.length===raw.length,dmax=0;
    for(i=2000;i<n4-2000;i+=7){var dd=Math.abs(pb.getChannelData(0)[RR[0]+i]-raw.getChannelData(0)[RBD[3]+i]);if(dd>dmax)dmax=dd}
    check('S11 ✂️ после эффектов: первый кусочек — это хвост эха',okp&&dmax<1e-6&&raw.length>q0.length*2,'длина '+(pb.length/sr).toFixed(2)+' с, разница '+dmax.toExponential(1));
    var pr=await T.render();
    check('S12 после эффектов: сохраняется порезанный звук',Math.abs(pr.length-pb.length-Math.ceil(0.05*sr))<2,(pr.length/sr).toFixed(2)+' с');
    SL.set({order:[2,3,0,1]});
    check('S13 перетащил кусочки — звук перерезан сразу, без новой обработки',SL.ready()&&SL.raw()===raw,'');
    T.fx([]);SL.set({mode:'pre',order:[0,1,2,3],rev:[false,false,false,false]});

    /* полоска кусочков: перетащить пальцем, коснуться */
    var cv=$('slStrip');cv.scrollIntoView({block:'center'});await sleep(150);
    SL.set({n:6,mode:'pre'});var r=cv.getBoundingClientRect(),bw=r.width/6,y=r.top+r.height/2;
    ptr('pointerdown',cv,r.left+bw*0.5,y);ptr('pointermove',cv,r.left+bw*1.5,y);ptr('pointermove',cv,r.left+bw*2.5,y);ptr('pointerup',cv,r.left+bw*2.5,y);await sleep(120);
    var st=SL.state();
    check('S14 перетащил первый кусочек на третье место',JSON.stringify(st.order)==='[1,2,0,3,4,5]'&&P.state().on,JSON.stringify(st.order)+' · '+$('msg').textContent);
    window.__slPng=cv.toDataURL('image/png');
    P.stop();
    ptr('pointerdown',cv,r.left+bw*4.5,y);ptr('pointerup',cv,r.left+bw*4.5,y);await sleep(100);
    var ps=P.state();
    check('S15 коснулся кусочка — играет с него',ps.on&&ps.ps.length&&Math.abs(ps.ps[0].a-4/6)<0.01,ps.ps.length?ps.ps[0].a.toFixed(3):'—');
    P.stop();

    $('slMore').click();await sleep(50);P.stop();
    var s3=SL.state();
    check('S16 ➕ — больше кусочков, и они перемешаны',s3.n===7&&s3.on,'n='+s3.n);
    $('slReset').click();await sleep(50);P.stop();
    check('S17 ↺ — по порядку, нарезка выключена',!SL.state().on&&SL.state().key==='','');
    $('slPost').click();await sleep(600);
    var s4=SL.state(),pl=P.state();
    check('S18 «после эффектов» сам режет и играет',s4.mode==='post'&&s4.on&&pl.on&&$('slPost').getAttribute('aria-pressed')==='true',$('msg').textContent);
    P.stop();$('slReset').click();await sleep(50);P.stop();$('slPre').click();await sleep(50);P.stop();$('slReset').click();await sleep(50);P.stop();

    /* случайности */
    var seen={},sliced=0;
    for(i=0;i<40;i++){P.surprise();P.stop();T.slices.state().on&&sliced++;W.__SA.test.player.state();}
    for(i=0;i<60;i++)SL.fxRandom().forEach(function(id){seen[id]=1});
    check('S19 🎲 Случайное волшебство берёт и новые эффекты',NEW.filter(function(id){return seen[id]}).length>=6,Object.keys(seen).length+' разных');
    check('S20 🎲 Сюрприз иногда режет звук',sliced>=4&&sliced<=28,sliced+' из 40');
    $('slReset').click();await sleep(50);P.stop();
    var m0=P.mix(),t0=P.state().temp,ch=0;
    for(i=0;i<6;i++){$('toolDice').click();await sleep(20);P.stop();if(P.mix()!==m0||P.state().temp!==t0)ch++}
    check('S21 🎲 Покрути за меня меняет сухо–мокро и температуру',ch>=4,ch+' из 6');
    $('fxDice').click();await sleep(30);P.stop();
    check('S22 кнопка 🎲 эффектов включает эффекты',P.state().fx>=1,P.state().fx+' эффектов');

    /* жалоба тестировщика: тишина в начале и в конце не должна превращаться в пустые кусочки */
    var Ls=Math.round(sr*2),S=new Float32Array(Ls);for(i=Math.round(sr*0.5);i<Math.round(sr*1.3);i++)S[i]=0.5*Math.sin(2*Math.PI*440*i/sr);
    T.load([S],sr);T.fx([]);P.mix(1);SL.set({n:4,mode:'pre',order:[3,2,1,0],rev:[false,false,false,false]});
    var cs=SL.src(),cd=cs.getChannelData(0),R4=SL.range(cs.length===Ls?T.slices.src():cs),q4=[],sl0=Math.round(sr*0.5),sl1=Math.round(sr*1.3),k4;
    for(k4=0;k4<4;k4++){var a4=sl0+Math.round((sl1-sl0)*k4/4)+200,e4=sl0+Math.round((sl1-sl0)*(k4+1)/4)-200,ss=0;for(i=a4;i<e4;i++)ss+=cd[i]*cd[i];q4.push(Math.sqrt(ss/(e4-a4)))}
    var headQ=0;for(i=0;i<Math.round(sr*0.45);i++)headQ=Math.max(headQ,Math.abs(cd[i]));
    check('S24 тишина по краям не режется: все 4 кусочка со звуком, тишина осталась на месте',q4.every(function(v){return v>0.3})&&headQ===0&&cs.length===Ls,q4.map(function(v){return v.toFixed(2)}).join(' ')+' · начало '+headQ);
    T.fx([['echo',3]]);SL.set({mode:'post',order:[3,2,1,0]});var ps4=await SL.post(),pr4=SL.raw(),PR=SL.range(pr4),pq=[];
    var PBD=SL.bounds(pr4),po=PR[0];
    [3,2,1,0].forEach(function(src){var len=PBD[src+1]-PBD[src],pa=po+300,pe=po+len-300,p2=0,dd=ps4.getChannelData(0);for(i=pa;i<pe;i++)p2+=dd[i]*dd[i];pq.push(Math.sqrt(p2/(pe-pa)));po+=len});
    check('S25 после эффектов: хвост эха не превращается в тихие кусочки',pq.every(function(v){return v>0.02}),pq.map(function(v){return v.toFixed(3)}).join(' ')+' · режу '+(PR[0]/sr).toFixed(2)+'–'+(PR[1]/sr).toFixed(2)+' с из '+(pr4.length/sr).toFixed(2));
    T.fx([]);SL.set({mode:'pre',order:[0,1,2,3]});
    /* ошибка со скриншота: при 11 кусочках несколько выпадали на паузы между нотами — каждому должна достаться равная доля звука */
    T.world.set(false);
    var gb=D.querySelector('#hist .hs.gift');if(gb)gb.click();else $('demoBtn').click();D.querySelector('#dpGrid [data-demo=bird]').click();await sleep(300);P.stop();T.fx([]);P.mix(1);
    var badN=[],detail=[];
    [2,4,6,8,11,12].forEach(function(nn){
      SL.set({n:nn,mode:'pre'});
      var bb=T.slices.src(),BD2=SL.bounds(bb),rm2=[],dd2=bb.getChannelData(0),q2,m2=0;
      for(q2=0;q2<nn;q2++){var s2=0,a2=BD2[q2],e2=BD2[q2+1];for(i=a2;i<e2;i++)s2+=dd2[i]*dd2[i];var r2=Math.sqrt(s2/Math.max(1,e2-a2));rm2.push(r2);m2=Math.max(m2,r2)}
      var eq=[],er=SL.range(bb);for(q2=0;q2<nn;q2++){var s3=0,a3=er[0]+Math.round((er[1]-er[0])*q2/nn),e3=er[0]+Math.round((er[1]-er[0])*(q2+1)/nn);for(i=a3;i<e3;i++)s3+=dd2[i]*dd2[i];eq.push(Math.sqrt(s3/Math.max(1,e3-a3)))}
      var worst=Math.min.apply(null,rm2)/m2,worstEq=Math.min.apply(null,eq)/Math.max.apply(null,eq);if(nn===11)window.__eq11=worstEq;detail.push(nn+':'+worst.toFixed(2)+(nn===11?' (раньше, поровну по времени: '+worstEq.toFixed(2)+')':''));if(worst<0.2)badN.push(nn+' (тише всех в '+(1/worst).toFixed(1)+' раза)');
    });
    check('S26 птичка (звук с паузами): при 2…12 кусочках ни один не пустой — самый тихий не слабее 20% самого громкого',!badN.length,badN.length?badN.join(', '):detail.join(' '));
    /* речь: три всплеска по 0,3 с и паузы по 0,5 с с еле слышным шумом (−44 дБ) — поровну по времени 3 из 11 кусочков были бы пустыми */
    var Ls2=Math.round(sr*2.2),V=new Float32Array(Ls2),sd=3;
    for(i=0;i<Ls2;i++){sd=(sd*16807)%2147483647;var tt=i/sr,inb=[[0.1,0.4],[0.9,1.2],[1.7,2.0]].some(function(r){return tt>=r[0]&&tt<r[1]}),ee=inb?Math.min(1,(tt-0.1)%0.8/0.02,1):1;V[i]=(inb?0.5*Math.sin(2*Math.PI*(300+60*Math.floor(tt*1.2))*tt):0)+0.003*(sd/1073741823.5-1)}
    T.load([V],sr);T.fx([]);P.mix(1);
    var badV=[],detV=[];
    [2,3,4,6,8,11,12].forEach(function(nn){
      SL.set({n:nn,mode:'pre'});
      var vb=T.slices.src(),VB=SL.bounds(vb),vd=vb.getChannelData(0),rv2=[],q3,e5,s5,mxv=0,mnE=1e9,mxE=0,vr=SL.range(vb);
      for(q3=0;q3<nn;q3++){s5=0;for(i=VB[q3];i<VB[q3+1];i++)s5+=vd[i]*vd[i];var r5=Math.sqrt(s5/Math.max(1,VB[q3+1]-VB[q3]));rv2.push(r5);mxv=Math.max(mxv,r5)}
      for(q3=0;q3<nn;q3++){s5=0;var a5=vr[0]+Math.round((vr[1]-vr[0])*q3/nn),b5=vr[0]+Math.round((vr[1]-vr[0])*(q3+1)/nn);for(i=a5;i<b5;i++)s5+=vd[i]*vd[i];var r6=Math.sqrt(s5/Math.max(1,b5-a5));mnE=Math.min(mnE,r6);mxE=Math.max(mxE,r6)}
      var wv=Math.min.apply(null,rv2)/mxv;detV.push(nn+':'+wv.toFixed(2)+(nn===11?' (раньше '+(mnE/mxE).toFixed(3)+')':''));if(wv<0.2)badV.push(nn);
    });
    check('S27 речь с паузами: при 2…12 кусочках ни один не пустой (самый тихий ≥ 20% самого громкого)',!badV.length,badV.length?'пустые при n = '+badV.join(', ')+' · '+detV.join(' '):detV.join(' '));
    SL.set({n:6,mode:'pre',order:[0,1,2,3,4,5],rev:[false,false,false,false,false,false]});
    /* мир: полоска на месте, нарезка слышна */
    T.load([Q],sr);T.fx([]);P.mix(1);T.out(1,0);
    T.world.set(true);await sleep(300);$('tourPick').hidden=true;
    SL.set({n:4,mode:'pre',order:[3,2,1,0],rev:[false,false,false,false]});
    var wq=await T.render();
    check('S23 в мире нарезка тоже слышна',near(freq(wq,0.05,0.25),600)&&$('slStrip').getBoundingClientRect().height>40,freq(wq,0.05,0.25).toFixed(0)+' Гц');
    T.world.set(false);

    await report({ok:true,results:results,png:window.__slPng});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
