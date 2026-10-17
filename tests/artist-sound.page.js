/* Страничная часть теста звука режима: грузится из index.html#sa-test&run=artist-sound.
   Вход — короткий импульс 440 Гц; смотрим, когда, на какой высоте и в каком ухе прозвучало эхо. */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  try{
    var T=window.__SA.test,sr=44100,F0=440;
    function burst(){
      var n=Math.round(sr*0.3),L=new Float32Array(n),i;
      for(i=0;i<Math.round(sr*0.05);i++){var w=0.5-0.5*Math.cos(2*Math.PI*i/(sr*0.05));L[i]=0.8*w*Math.sin(2*Math.PI*F0*i/sr)}
      return L;
    }
    function load(){var a=burst();T.load([a,new Float32Array(a)],sr);T.fx([]);T.out(1,0)}
    function energy(d,t0,t1){var s=0,i;for(i=Math.round(t0*sr);i<Math.min(d.length,Math.round(t1*sr));i++)s+=d[i]*d[i];return s}
    /* частота с наибольшей энергией в окне (простой перебор по Гц) */
    function peakHz(d,t0,t1){
      var a=Math.round(t0*sr),b=Math.min(d.length,Math.round(t1*sr)),best=0,bf=0,f,i;
      for(f=150;f<=1200;f+=3){var re=0,im=0,w=2*Math.PI*f/sr;for(i=a;i<b;i++){re+=d[i]*Math.cos(w*i);im+=d[i]*Math.sin(w*i)}var m=re*re+im*im;if(m>best){best=m;bf=f}}
      return bf;
    }
    function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)}
    var C=T.core;
    function paintDot(x,y,pan){var cv=T.canvas();C.saClear(cv);C.saDot(cv,x,y,0.001,30000,pan,'pen')}
    async function go(o){T.artist(o);return T.render()}

    load();
    var off=await T.render(),offHash=hash(off);

    /* A. белая точка пером на 250 мс у горизонта */
    paintDot(0.25/3,0.5,0);
    var A=await go({on:true,seed:5,influence:1,blur:0}),L=A.getChannelData(0),R=A.getChannelData(1);
    var eDry=energy(L,0,0.12),eEcho=energy(L,0.18,0.42),eRest=energy(L,0.5,A.duration);
    check('A1 эхо слышно около 250 мс',eEcho>0.2*eDry,'энергия эха/оригинала = '+(eEcho/eDry).toFixed(2));
    check('A2 вне эха тихо',eRest<0.01*eDry,'остальное/оригинал = '+(eRest/eDry).toExponential(1));
    check('A3 белая краска — по центру',Math.abs(energy(L,0.18,0.42)-energy(R,0.18,0.42))<0.02*eEcho,'L='+energy(L,0.18,0.42).toExponential(2)+' R='+energy(R,0.18,0.42).toExponential(2));
    var fA=peakHz(L,0.2,0.4);
    check('A4 у горизонта высота как у оригинала (440 Гц ± 25)',Math.abs(fA-F0)<25,'f = '+fA+' Гц');
    check('A5 оригинал на месте',peakHz(L,0,0.05)>=F0-10&&peakHz(L,0,0.05)<=F0+10,'f = '+peakHz(L,0,0.05));
    check('A6 хвост не обрезан (последние 10 мс тихие)',energy(L,A.duration-0.01,A.duration)<1e-6*eDry,'длина '+A.duration.toFixed(3)+' с');

    /* B. та же точка голубым → эхо слева */
    paintDot(0.25/3,0.5,-1);
    var B=await go({on:true,seed:5}),BL=B.getChannelData(0),BR=B.getChannelData(1);
    check('B1 голубая краска — эхо в левом ухе',energy(BR,0.18,0.42)<0.02*energy(BL,0.18,0.42),'R/L = '+(energy(BR,0.18,0.42)/energy(BL,0.18,0.42)).toExponential(1));
    /* C. янтарная → справа */
    paintDot(0.25/3,0.5,1);
    var Cc=await go({on:true,seed:5}),CL=Cc.getChannelData(0),CR=Cc.getChannelData(1);
    check('C1 янтарная краска — эхо в правом ухе',energy(CL,0.18,0.42)<0.02*energy(CR,0.18,0.42),'L/R = '+(energy(CL,0.18,0.42)/energy(CR,0.18,0.42)).toExponential(1));

    /* D. выше горизонта → выше по тону; ниже → ниже */
    paintDot(0.25/3,0.2,0);
    var up=await go({on:true,seed:5}),fUp=peakHz(up.getChannelData(0),0.2,0.4),want=F0*Math.pow(2,0.6*12/12);
    check('D1 выше горизонта → выше тон (ожидали ≈ '+Math.round(want)+' Гц)',Math.abs(fUp-want)<30,'f = '+fUp+' Гц');
    paintDot(0.25/3,0.8,0);
    var dn=await go({on:true,seed:5}),fDn=peakHz(dn.getChannelData(0),0.2,0.45),wantD=F0*Math.pow(2,-0.6);
    check('D2 ниже горизонта → ниже тон (ожидали ≈ '+Math.round(wantD)+' Гц)',Math.abs(fDn-wantD)<30,'f = '+fDn+' Гц');

    /* E. детерминизм */
    paintDot(0.4,0.4,0.3);
    var r1=await go({on:true,seed:77,influence:0.7,blur:0.05}),plan1=JSON.stringify(T.plan()),r2=await T.render(),plan2=JSON.stringify(T.plan()),md=0,mi=-1,q;for(q=0;q<r1.length;q++){var df=Math.abs(r1.getChannelData(0)[q]-r2.getChannelData(0)[q]);if(df>md){md=df;mi=q}}
    var e1=hash(r1),e2=hash(r2),e3=hash(await go({on:true,seed:78,influence:0.7,blur:0.05}));

    check('E1 тот же seed и холст → тот же план эх и звук (расхождение < 1e-6)',plan1===plan2&&md<1e-6,'план '+(plan1===plan2?'совпал':'РАЗНЫЙ')+', макс. разница звука '+md.toExponential(1)+' (шум суммирования движка)');
    check('E2 другой seed → другой звук',e1!==e3,e1+' / '+e3);

    /* F. выключили → как было */
    T.artist({on:false});
    var offAgain=hash(await T.render());
    check('F1 после выключения звук снова бит в бит как до включения',offAgain===offHash,offHash+' / '+offAgain);

    /* G. пресеты: не выходят за потолок, звучат, хвост цел */
    var presets=['classic','rain','mountains','pingpong','double','cloud','mirror'],gold={};
    for(var i=0;i<presets.length;i++){
      var p=presets[i],r=await go({on:true,seed:2026,influence:1,blur:0,preset:p}),pk=0,c,k;
      for(c=0;c<2;c++){var d=r.getChannelData(c);for(k=0;k<d.length;k++){var a=Math.abs(d[k]);if(a>pk)pk=a}}
      var ed=energy(r.getChannelData(0),0.1,r.duration)+energy(r.getChannelData(1),0.1,r.duration);
      check('G «'+p+'»: пик '+pk.toFixed(3)+' ≤ 1, эхо звучит',pk<=1&&ed>0,'пик='+pk.toFixed(3)+' длина='+r.duration.toFixed(2)+' с');
      gold[p]=hash(r);
    }
    /* H. смесь: эффект «Хор»/«Рация» поверх эх тоже работает (цепочка общая) */
    T.fx([['radio',2]]);
    var withFx=await go({on:true,seed:2026,preset:'mountains'});
    var noFx=hash(withFx);
    check('H1 эффекты действуют и на эха (рендер отличается от чистого)',noFx!==gold['mountains'],'');
    T.artist({on:false});T.fx([]);

    /* I. нагрузка: самая длинная запись 15 с, стерео, 24 эха + 3 эффекта */
    var big=new Float32Array(sr*15),bi;for(bi=0;bi<big.length;bi++)big[bi]=0.4*Math.sin(2*Math.PI*(200+300*Math.sin(bi/sr))*bi/sr);
    T.load([big,new Float32Array(big)],sr);T.fx([['radio',2],['cave',2],['chorus',1]]);
    var t0=performance.now(),big1=await go({on:true,seed:5,influence:1,preset:'rain'}),ms=performance.now()-t0;
    T.fx([['radio',2],['cave',2],['chorus',1]]);T.artist({on:false});
    var t1=performance.now();await T.render();var ms0=performance.now()-t1;
    check('I1 15 с + 3 эффекта: рендер с режимом быстрее реального времени в 3+ раза',ms<big1.duration*1000/3,'с режимом '+Math.round(ms)+' мс на '+big1.duration.toFixed(1)+' с звука (x'+(big1.duration*1000/ms).toFixed(1)+' от реального времени); без режима '+Math.round(ms0)+' мс');
    await report({ok:true,results:results,hashes:gold});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
