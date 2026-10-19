/* G1, часть 2: искры от касаний и бесконечные анимации. #sa-test&run=flash2 */
(async function(){
  var results=[];
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
    var fr=document.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    var W=fr.contentWindow,D=fr.contentDocument,$=function(id){return D.getElementById(id)};
    var errs=[];W.addEventListener('error',function(e){errs.push(String(e.message||e))});
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    var T=W.__SA.test,P=T.player,sr=44100,tone=new Float32Array(sr),i;
    for(i=0;i<sr;i++)tone[i]=0.4*Math.sin(2*Math.PI*300*i/sr);
    T.load([tone],sr);T.ui();await sleep(400);

    /* ---- 1. искры от касаний: не больше 3 вспышек в любой секунде, касания работают ---- */
    function maxPerSecond(ts){var m=0,a,b;for(a=0;a<ts.length;a++){b=a;while(b<ts.length&&ts[b]-ts[a]<=1000)b++;m=Math.max(m,b-a)}return m}
    var bursts=[],t0=W.performance.now(),lastN=0;
    var mo=new W.MutationObserver(function(){var n=D.querySelectorAll('.note').length;if(n>lastN&&(n-lastN)>=1){bursts.push(W.performance.now())}lastN=n;});
    /* считаем появление групп искр: за один burst в body добавляется 6 .note подряд — группируем записи по времени */
    var raw=[];var mo2=new W.MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(nd){if(nd.classList&&nd.classList.contains('note'))raw.push(W.performance.now())})})});
    mo2.observe(D.body,{childList:true});
    var tiles=Array.prototype.slice.call(D.querySelectorAll('#grid .t'));
    T.flash.reset();
    for(i=0;i<20;i++){tiles[1+(i%8)].click();await sleep(60)}   /* 20 касаний за ≈1,2 с */
    P.stop();await sleep(300);
    mo2.disconnect();
    var groups=[];raw.forEach(function(t){if(!groups.length||t-groups[groups.length-1]>5)groups.push(t)});
    var st=T.flash.stats();
    check('искры: 20 быстрых касаний — вспышек в любой секунде ≤ 3',groups.length>=1&&maxPerSecond(groups)<=3,groups.length+' всего, макс в секунду '+maxPerSecond(groups));
    check('ограничитель отбросил лишние искры (dropped > 0)',st.dropped>0,'показано '+st.shown+', отброшено '+st.dropped);
    check('сами касания не пострадали: уровень плитки менялся',tiles.some(function(t){return +t.getAttribute('data-l')>0}),'');
    var log=T.flash.log().filter(function(e){return e[1]==='burst'}).map(function(e){return e[0]});
    check('по журналу ограничителя: искр ≤ 3 в секунду',maxPerSecond(log)<=3,'макс '+maxPerSecond(log));
    await sleep(1200);T.flash.reset();
    var n0=D.querySelectorAll('.note').length;tiles[2].click();await sleep(100);P.stop();
    check('после паузы искры снова появляются',D.querySelectorAll('.note').length>n0);

    /* ---- 2. бесконечные анимации: переходы света ≤ 3 в секунду ---- */
    var LUM=/opacity|filter|box-shadow|background|color|text-shadow/;
    var kf={};
    Array.prototype.forEach.call(D.styleSheets,function(ss){Array.prototype.forEach.call(ss.cssRules,function(r){if(r.type===7)kf[r.name]=r.cssText})});
    function lumKF(name){var t=kf[name];return !!t&&LUM.test(t.replace(/^[^{]*\{/,''))}
    function parseDur(s){var m=/([\d.]+)(m?s)/.exec(s);return m?(m[2]==='ms'?+m[1]/1000:+m[1]):0}
    var rows=[],bad=[],info=[];
    function consider(where,name,dur,alt){
      if(!name||name==='none'||!dur)return;
      var period=alt?dur*2:dur,tr=2/period,lum=lumKF(name);
      rows.push(where+': '+name+' '+(lum?'свет':'движение')+' период '+period.toFixed(2)+' с = '+tr.toFixed(2)+' перех./с');
      if(lum&&tr>3)bad.push(where+' '+name);
      if(!lum&&tr>3)info.push(where+' '+name+' '+tr.toFixed(1));
    }
    /* а) правила таблицы стилей с animation ... infinite (кроме плиток, у них длительность из переменной) */
    Array.prototype.forEach.call(D.styleSheets,function(ss){Array.prototype.forEach.call(ss.cssRules,function(r){
      if(r.type!==1||!r.style)return;var a=r.style.animation||'';
      if(!/infinite/.test(a))return;
      if(/\.t\.sel \.em|--an/.test(r.selectorText)||/var\(/.test(a))return;
      var nm=r.style.animationName||/^\s*([\w-]+)/.exec(a)[1],du=parseDur(r.style.animationDuration||a);
      consider(r.selectorText,nm,du,/alternate/.test(r.style.animationDirection||a));
    })});
    /* б) плитки эффектов: включённая плитка в покое и во время проигрывания (длительность ×0,4) */
    var worstTile=0;
    for(i=1;i<tiles.length;i++){
      tiles[i].click();await sleep(30);P.stop();
      var em=tiles[i].querySelector('.em');
      for(var pl=0;pl<2;pl++){
        D.body.classList.toggle('playing',pl===1);
        var cs=W.getComputedStyle(em),dur=parseDur(cs.animationDuration.split(',')[0]);
        consider('плитка '+tiles[i].getAttribute('data-id')+(pl?' (играет)':''),cs.animationName.split(',')[0],dur,/alternate/.test(cs.animationDirection));
        worstTile=Math.max(worstTile,dur?2/dur:0);
      }
    }
    D.body.classList.remove('playing');
    check('бесконечных анимаций проверено ≥ 24 + 3',rows.length>=27,rows.length+' шт');
    check('ни одна бесконечная анимация света не быстрее 3 переходов/с (строгий счёт 2 за цикл)',bad.length===0,bad.join('; ')||('быстрейшая плитка: '+worstTile.toFixed(2)+' перех./с'));
    check('справка: анимации движения быстрее 3 переходов/с (не свет) — перечислены',true,info.join('; ')||'нет');
    check('ошибок JS нет',errs.length===0,errs.join(' | '));
    report({ok:true,results:results,rows:rows});
  }catch(e){report({ok:false,error:String(e&&e.stack||e),results:results})}
})();
