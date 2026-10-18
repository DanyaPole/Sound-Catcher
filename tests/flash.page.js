/* G1: вспышки в мире — не больше 3 в секунду. #sa-test&run=flash (фрейм 375×812)
   Худшие случаи: эха каждые 0,25–0,28 с (картины «Пинг-понг» и «Эхо») и удары каждые 0,25 с с эффектом «Эхо» (круги от ударов).
   Считаем двумя независимыми способами: по событиям (журнал ограничителя) и по пикселям (яркость слоёв света и холста эха). */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  /* самое большое число событий в любом ЗАКРЫТОМ отрезке 1 с */
  function maxPerSecond(ts){var m=0,i,j;for(i=0;i<ts.length;i++){j=i;while(j<ts.length&&ts[j]-ts[i]<=1000)j++;m=Math.max(m,j-i)}return m}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}');localStorage.removeItem('zv-curves');localStorage.removeItem('zv-echo')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var errs=[];W.addEventListener('error',function(e){errs.push(String(e.message||e))});
    var T=W.__SA.test,F=T.flash,P=T.player,sr=44100;
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;

    /* удары каждые 0,25 с по 60 мс (200 мс паузы) — каждый удар рисует круг (эффект «Эхо») */
    var len=Math.round(sr*1.5),A=new Float32Array(len),i;
    for(i=0;i<len;i++){var ph=(i/sr)%0.25;A[i]=ph<0.06?0.6*Math.sin(2*Math.PI*300*i/sr)*Math.min(1,ph/0.004,(0.06-ph)/0.01):0}
    T.load([A],sr);T.ui();T.out(1,0);P.mix(1);
    T.world.set(true);await sleep(400);$('tourPick').hidden=true;

    /* яркость слоёв по пикселям: свет мира (весь экран) и холст эха (≈18% экрана) */
    /* средняя яркость слоя: сжатие вдвое по шагам (честное усреднение — узкая бегущая полоска не «дребезжит» при сжатии за один раз) */
    var stepA=D.createElement('canvas'),stepB=D.createElement('canvas');
    function lum(c,frac){
      if(!c||!c.width)return 0;
      var w=c.width,h=c.height,src=c,cur=stepA,g;
      while(w>64&&h>64){var nw=Math.max(1,w>>1),nh=Math.max(1,h>>1);cur.width=nw;cur.height=nh;g=cur.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(src,0,0,w,h,0,0,nw,nh);src=cur;cur=cur===stepA?stepB:stepA;w=nw;h=nh}
      cur=src===c?stepA:src;if(src===c){stepA.width=w;stepA.height=h;stepA.getContext('2d').drawImage(c,0,0);cur=stepA}
      var d=cur.getContext('2d').getImageData(0,0,w,h).data,s=0,k;for(k=0;k<d.length;k+=4)s+=(0.2126*d[k]+0.7152*d[k+1]+0.0722*d[k+2])/255*d[k+3]/255;
      return s/(w*h)*frac;
    }
    var area=$('ecTop').clientWidth*$('ecTop').clientHeight/(375*812);

    async function scenario(name,preset,max,ms){
      F.setMax(max);F.reset();
      T.fx([['echo',3]]);
      T.artist({on:true,seed:5,preset:preset});
      P.rep('loop',true);
      var samples=[],t0=performance.now(),run=true;
      (function loop(){
        if(!run)return;
        samples.push([performance.now()-t0,lum($('worldfx'),1)+lum($('ecTop'),area)]);
        W.requestAnimationFrame(loop);
      })();
      P.play();await sleep(ms);P.stop();run=false;await sleep(50);
      var log=F.log().map(function(e){return e[0]}),st=F.stats();
      /* пары «подъём — спад» яркости не меньше h (гистерезис); h в 20 раз строже порога WCAG в 10% */
      var h=0.005,mx=0,dir=0,ext=samples[0]?samples[0][1]:0,pairs=[],lo=1e9,hi=-1e9;
      samples.forEach(function(q){var v=q[1];lo=Math.min(lo,v);hi=Math.max(hi,v);
        if(dir>=0){if(v>ext)ext=v;if(ext-v>=h){if(dir===1)pairs.push(q[0]);dir=-1;ext=v}if(dir===0&&v-ext>=h){dir=1;ext=v}}
        else{if(v<ext)ext=v;if(v-ext>=h){dir=1;ext=v}}});
      return {name:name,max:maxPerSecond(log),shown:st.shown,dropped:st.dropped,pairs:maxPerSecond(pairs),swing:hi-lo,frames:samples.length,echoes:T.ec.log().length};
    }
    /* 1. без ограничителя: убеждаемся, что без него правило нарушается (иначе тест ничего не доказывает) */
    var u1=await scenario('Пинг-понг, без ограничителя','pingpong',1000,5000);
    check('F1 без ограничителя худший случай нарушает: больше 3 вспышек в секунду',u1.max>3,'пинг-понг: '+u1.max+' в секунду ('+u1.shown+' за 5 с)');
    /* 2. с ограничителем */
    var res=[];
    for(var nm of [['Пинг-понг','pingpong'],['Эхо 0,28 с','classic'],['Дождь','rain'],['Облако','cloud']]){
      var r=await scenario(nm[0],nm[1],3,5000);res.push(r);
      check('F2 '+nm[0]+': в любой секунде не больше 3 вспышек (по событиям)',r.max<=3&&r.shown>0,'максимум '+r.max+' в секунду · показано '+r.shown+', убрано '+r.dropped);
    }
    var worstSwing=Math.max.apply(null,res.map(function(r){return r.swing}));
    var worstPairs=Math.max.apply(null,res.map(function(r){return r.pairs}));
    check('F4 размах яркости слоёв света мал: меньше 10% яркости экрана (порог WCAG для общей вспышки)',worstSwing<0.10,'наибольший размах '+(worstSwing*100).toFixed(2)+'% · кадров измерено '+res.reduce(function(a,r){return a+r.frames},0)+' · справочно: пар «ярче — темнее» ≥ 0,5% (в 20 раз строже порога) до '+worstPairs+' в секунду, включая пропадание бегущей развёртки на стыке повторов');
    var busy=res.filter(function(r){return r.dropped>0});
    check('F5 ограничитель правда работал: в плотных картинах лишние убраны',busy.length>=2,busy.map(function(r){return r.name+' −'+r.dropped}).join(', '));
    var starved=res.filter(function(r){return r.shown<9});
    check('F6 но не слишком строго: за 5 с показано не меньше 9 вспышек (≈2 в секунду)',!starved.length,res.map(function(r){return r.name+' '+r.shown}).join(' · '));
    check('F7 звук не тронут: все эха из плана на месте (журнал эх не урезан)',res.every(function(r){return r.echoes>=8}),res.map(function(r){return r.name+' '+r.echoes}).join(' · '));
    /* 3. одна вспышка в секунду и реже — всё показано, ничего не отбрасывается */
    /* хвост кругов прошлого сценария (до 1,8 с) не должен попасть в этот счёт */
    P.rep('once',true);await sleep(2200);
    F.setMax(3);F.reset();T.taps(3);T.artist({on:true,seed:5,preset:'mountains'});T.fx([]);P.rep('once',true);P.play();await sleep(3400);P.stop();
    var st3=F.stats();
    check('F8 редкие вспышки (3 эха за проход) показываются все, ничего не убрано',st3.dropped===0&&st3.shown>=3,'показано '+st3.shown+', убрано '+st3.dropped);
    check('F9 ошибок JavaScript нет',!errs.length,errs.slice(0,3).join(' | '));
    F.setMax(3);
    await report({ok:true,results:results});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
