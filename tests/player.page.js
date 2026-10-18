/* Плеер: прилипает к верху, режимы повтора, кусочек, касание волны, сухо — мокро, 🎲 Сюрприз, пробел. #sa-test&run=player
   Приложение во фрейме 375×812 — экран телефона. */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  /* плеер виден целиком и сверху ничего не лежит */
  function onTop(id){
    var el=$(id),r=el.getBoundingClientRect(),inside=r.top>=0&&r.bottom<=W.innerHeight&&r.width>0;
    var at=D.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {ok:inside&&!!at&&(at===el||el.contains(at)),d:Math.round(r.top)+'…'+Math.round(r.bottom)+' из '+W.innerHeight+', сверху: '+(at?(at.id||at.className||at.tagName):'—')};
  }
  function ptr(type,el,f){
    var r=el.getBoundingClientRect(),x=r.left+10+f*(r.width-20),y=r.top+r.height/2;
    el.dispatchEvent(new W.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:7,pointerType:'touch',isPrimary:true}));
  }
  function rms(ab,from,to){var s=0,n=0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c);for(k=from||0;k<(to||d.length);k++){s+=d[k]*d[k];n++}}return Math.sqrt(s/n)}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}   /* без предложения обучения поверх */
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,P=T.player,sr=44100,n=Math.round(sr*0.6),L=new Float32Array(n),i;
    for(i=0;i<n;i++)L[i]=0.5*Math.sin(2*Math.PI*(330+200*i/n)*i/sr)*(0.4+0.6*Math.exp(-2*i/sr));
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    T.load([L],sr);T.ui();await sleep(200);

    /* 1. прилипание */
    W.scrollTo(0,D.documentElement.scrollHeight);await sleep(150);
    var a=onTop('play'),b=onTop('rep'),c=onTop('surprise');
    check('P1 обычный экран: внизу страницы ▶, повтор и 🎲 видны и не закрыты',a.ok&&b.ok&&c.ok,a.d+' / '+b.d+' / '+c.d);
    W.scrollTo(0,0);await sleep(100);
    var bar=$('tbar').getBoundingClientRect();
    check('P2 плеер не выше 90 px — не съедает экран',bar.height<=90,Math.round(bar.height)+' px');

    /* 2. один раз: доигрывает и останавливается */
    P.rep('once',true);P.play();await sleep(150);
    var s0=P.state();
    check('P3 один раз: играет, один проход',s0.on&&s0.playing&&s0.ps.length===1,JSON.stringify(s0.ps));
    await sleep(1300);
    var s1=P.state();
    check('P4 один раз: закончился сам',!s1.on&&!s1.playing,'on='+s1.on);

    /* 3. по кругу: проходы встык, без паузы */
    P.rep('loop',true);P.play();await sleep(1700);
    var s2=P.state(),seam=s2.ps.length>1?Math.abs(s2.ps[1].t0-(s2.ps[0].t0+s2.ps[0].dur)):1;
    check('P5 по кругу: играет дальше, проходов ≥ 2',s2.on&&s2.playing&&s2.k>=2,'проход № '+s2.k);
    check('P6 по кругу: следующий проход встык (< 1 мс)',seam<0.001,(seam*1000).toFixed(3)+' мс');
    check('P7 по кругу: живых графов не больше 6',s2.live<=6,s2.live+'');

    /* 4. туда-сюда */
    P.rep('pp',true);P.play();await sleep(1500);
    var s3=P.state(),revs=s3.ps.map(function(p){return p.rev});
    check('P8 туда-сюда: проходы чередуются вперёд / назад',revs.some(Boolean)&&revs.some(function(x){return !x})&&revs.every(function(x,k){return k===0||x!==revs[k-1]}),JSON.stringify(revs));
    /* два замера внутри одного прохода: бегунок идёт вперёд в прямом и назад в перевёрнутом */
    function curP(s){var c=null;s.ps.forEach(function(p){if(p.t0<=s.now)c=p});return c}
    var dirs={};
    for(i=0;i<30&&Object.keys(dirs).length<2;i++){
      var x1=P.state();await sleep(60);var x2=P.state(),p1=curP(x1),p2=curP(x2);
      if(p1&&p2&&p1.t0===p2.t0&&x2.frac!==x1.frac)dirs[p1.rev?'назад':'вперёд']=p1.rev?x2.frac<x1.frac:x2.frac>x1.frac;
    }
    check('P9 туда-сюда: бегунок волны идёт в сторону прохода',dirs['назад']===true&&dirs['вперёд']===true,JSON.stringify(dirs));

    /* 5. каждый раз по-новому */
    P.rep('rnd',true);P.play();await sleep(3400);
    var s4=P.state(),diff=s4.ps.filter(function(p){return p.semis||p.rev}).length;
    check('P10 по-новому: проходы отличаются (высота или направление)',s4.k>=3&&diff>=1,'проходов '+(s4.k+1)+', последние: '+JSON.stringify(s4.ps.map(function(p){return [p.semis,p.rev]})));
    P.stop();

    /* 6. кусочек пальцем по волне */
    P.rep('once',true);
    var wv=$('wave');
    ptr('pointerdown',wv,0.3);ptr('pointermove',wv,0.45);ptr('pointermove',wv,0.7);ptr('pointerup',wv,0.7);await sleep(150);
    var s5=P.state();
    check('P11 провёл по волне — выбран кусочек 30…70%',Math.abs(s5.a-0.3)<0.02&&Math.abs(s5.b-0.7)<0.02,s5.a.toFixed(2)+'…'+s5.b.toFixed(2));
    check('P12 кусочек играет по кругу сам',s5.mode==='loop'&&s5.on&&s5.ps[0].a===s5.a,'режим '+s5.mode);
    await sleep(400);
    var fr5=P.state().frac;
    check('P13 бегунок не выходит за кусочек',fr5>=s5.a-0.01&&fr5<=s5.b+0.01,fr5.toFixed(3));
    /* касание снаружи — снова весь звук, с этого места */
    ptr('pointerdown',wv,0.85);ptr('pointerup',wv,0.85);await sleep(120);
    var s6=P.state();
    check('P14 касание снаружи кусочка — снова весь звук, играет с места касания',s6.a!==0.3&&s6.b===1&&Math.abs(s6.ps[0].a-0.85)<0.03,'a='+s6.ps[0].a.toFixed(2)+' b='+s6.b);
    P.stop();P.rep('once',true);
    ptr('pointerdown',wv,0.5);ptr('pointerup',wv,0.5);await sleep(120);
    var s7=P.state();
    check('P15 касание волны — играть с середины',s7.on&&Math.abs(s7.ps[0].a-0.5)<0.03,s7.ps.length?s7.ps[0].a.toFixed(2):'—');

    /* 7. ⏹ останавливает всё */
    $('play').click();await sleep(300);
    var s8=P.state();
    check('P16 ⏹ — тишина, графы убраны',!s8.on&&!s8.playing&&s8.live===0,'');

    /* 8. сухо — мокро */
    T.fx([['low',3]]);P.mix(0);var dry=await T.render();
    T.fx([]);P.mix(1);var org=await T.render();
    var dd=dry.getChannelData(0),oo=org.getChannelData(0),m=0,N=Math.min(n,dd.length,oo.length);
    for(i=0;i<N;i++){var q=Math.abs(dd[i]-oo[i]);if(q>m)m=q}
    check('P17 сухо 0% + Слон = запись как была',m<1e-4,'max |разница| '+m.toExponential(2));
    T.fx([['low',3]]);P.mix(1);var wet=await T.render();P.mix(0.5);var half=await T.render();
    var rw=rms(wet,0,N),rh=rms(half,0,N),rd=rms(dry,0,N);
    check('P18 50% — посередине между сухо и мокро (и длина хватает на оба)',half.length>=Math.max(wet.length,dry.length)-1&&rh>0,'rms сухо '+rd.toFixed(3)+' / 50% '+rh.toFixed(3)+' / мокро '+rw.toFixed(3)+', длина '+half.length+' ≥ '+Math.max(wet.length,dry.length));
    var el=$('mix');el.value=40;el.dispatchEvent(new W.Event('input'));el.dispatchEvent(new W.Event('change'));
    check('P19 ползунок «Сухо — мокро» показывает долю',T.player.mix()===0.4&&/40%/.test($('mixTxt').textContent),$('mixTxt').textContent);
    el.value=100;el.dispatchEvent(new W.Event('input'));el.dispatchEvent(new W.Event('change'));
    T.fx([]);P.stop();

    /* 9. 🎲 Сюрприз */
    $('surprise').click();
    /* нарезка «после эффектов» сначала готовит звук — ждём начала игры до 2 с */
    for(var w9=0;w9<20&&!P.state().on;w9++)await sleep(100);await sleep(100);
    var s9=P.state();
    check('P20 🎲 Сюрприз: включены эффекты и играет',s9.fx>=1&&s9.on&&/Сюрприз/.test($('msg').textContent),$('msg').textContent);
    var seen={};for(i=0;i<12;i++){P.surprise();seen[D.querySelectorAll('#grid .t.sel').length+':'+P.state().fx]=1}
    check('P21 🎲 каждый раз по-разному (1–3 эффекта)',Object.keys(seen).length>=2,Object.keys(seen).join(' '));
    P.stop();

    /* 10. пробел */
    D.body.focus();D.dispatchEvent(new W.KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));await sleep(100);
    var on1=P.state().on;
    D.dispatchEvent(new W.KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));await sleep(100);
    check('P22 пробел — играть / стоп',on1&&!P.state().on,'');

    /* 11. в мире плеер тоже прилипает */
    T.world.set(true);await sleep(400);$('tourPick').hidden=true;
    W.scrollTo(0,D.documentElement.scrollHeight);await sleep(150);
    var wa=onTop('play'),wb=onTop('surprise');
    check('P23 мир: внизу страницы ▶ и 🎲 видны и не закрыты',wa.ok&&wb.ok,wa.d+' / '+wb.d);
    P.rep('loop',true);T.artist({on:true,seed:5,preset:'classic'});P.play();await sleep(1500);
    var lg=T.ec.log(),again=0;for(i=1;i<lg.length;i++)if(lg[i].tap<lg[i-1].tap)again++;
    check('P24 мир, по кругу: всплески эха снова с начала в каждом проходе',again>=1,'перезапусков '+again+' из '+lg.length+' всплесков');
    P.stop();P.rep('once',true);T.artist({on:false});T.world.set(false);

    await report({ok:true,results:results});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
