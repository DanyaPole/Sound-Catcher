/* «Чистый звук» и правки нот: сбрасываются ли правки? #sa-test&run=cleannotes (только чтение: ничего не чинит) */
(async function(){
  var results=[],info=[];
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
    var T=W.__SA.test,P=T.player,N=T.notes,sr=44100;
    function nEdits(){return Object.keys(N.edits()).length}
    function vals(){return Object.keys(N.edits()).map(function(k){return N.edits()[k]}).sort().join(',')}
    async function toggle(){$('chipClean').click();await sleep(500);P.stop()}
    function say(){return $('msg').textContent}

    /* ---- A. синтетика: 5 нот с шумом и гулом 50 Гц ---- */
    var freqs=[220,262,330,392,440],len=Math.round(sr*2.2),a=new Float32Array(len),i,k,seed=7;
    function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296-0.5}
    for(k=0;k<freqs.length;k++){var s0=Math.round(sr*(0.1+k*0.4)),n=Math.round(sr*0.32);
      for(i=0;i<n;i++){var env=Math.min(1,i/(0.02*sr),(n-i)/(0.04*sr));a[s0+i]+=0.45*env*Math.sin(2*Math.PI*freqs[k]*i/sr)}}
    for(i=0;i<len;i++)a[i]+=0.03*Math.sin(2*Math.PI*50*i/sr)+0.02*rnd();
    T.load([a],sr);T.ui();await sleep(300);N.tab();await sleep(400);
    var runs=N.runs();
    info.push('A: нот найдено '+runs.length);
    check('A0 в синтетической записи найдено ≥ 3 нот (есть что править)',runs.length>=3,runs.length+' нот');
    var pick=[0,1,2].filter(function(j){return j<runs.length});
    N.set(pick[0],2);N.set(pick[1],-1);if(pick[2]!=null)N.set(pick[2],3);await sleep(300);
    var e0=nEdits(),v0=vals();
    check('A1 правки поставлены',e0===pick.length,e0+' правок: '+v0);
    await toggle();
    var e1=nEdits(),v1=vals(),m1=say();
    info.push('A: чистый звук ВКЛ: правок '+e0+' → '+e1+' ('+v0+' → '+v1+'); сообщение: «'+m1.slice(0,120)+'»');
    check('A2 включил «Чистый звук»: все правки на месте (количество и значения)',e1===e0&&v1===v0,e0+' → '+e1+'; '+v0+' → '+v1+'; '+m1.slice(0,80));
    check('A3 если бы правка пропала — приложение сказало бы об этом',e1===e0||/правк/.test(m1),m1.slice(0,100));
    await toggle();
    var e2=nEdits(),v2=vals();
    check('A4 выключил «Чистый звук»: правки на месте',e2===e0&&v2===v0,e0+' → '+e2+'; '+v0+' → '+v2);
    for(k=0;k<4;k++)await toggle();
    check('A5 ещё 4 переключения подряд: правки на месте',nEdits()===e0&&vals()===v0,nEdits()+' правок: '+vals());
    /* правка, сделанная при включённом чистом звуке, переживает выключение */
    await toggle();var on=$('chipClean').getAttribute('aria-checked')==='true';
    var r2=N.runs();if(r2.length>3){N.set(3,-2)}
    var e3=nEdits(),v3=vals();await toggle();
    check('A6 правки, поставленные при включённом «Чистом звуке», переживают его выключение',on&&nEdits()===e3&&vals()===v3,e3+' → '+nEdits()+'; '+v3+' → '+vals());

    /* ---- B. готовый звук «пианино» (нет шума): тоже через интерфейс ---- */
    $('demoBtn').click();await sleep(100);
    var dm=D.querySelector('#dpGrid [data-demo=piano]');
    if(!dm){$('gateDemo')&&$('gateDemo').click();dm=D.querySelector('#dpGrid [data-demo=piano]')}
    if(dm){dm.click();await sleep(1500);P.stop();N.tab();await sleep(400);
      var rb=N.runs();info.push('B: пианино, нот '+rb.length);
      if(rb.length>=3){N.set(0,2);N.set(1,-2);N.set(2,1);await sleep(300);
        var b0=nEdits(),bv0=vals();await toggle();
        var b1=nEdits(),bv1=vals(),bm=say();
        info.push('B: чистый звук ВКЛ: правок '+b0+' → '+b1+' ('+bv0+' → '+bv1+'); сообщение: «'+bm.slice(0,120)+'»');
        check('B1 пианино: включил «Чистый звук» — правки на месте',b1===b0&&bv1===bv0,b0+' → '+b1+'; '+bv0+' → '+bv1);
        await toggle();
        check('B2 пианино: выключил — правки на месте',nEdits()===b0&&vals()===bv0,nEdits()+'; '+vals());
      }else check('B0 в пианино найдено ≥ 3 нот',false,rb.length+' нот');
    }else check('B0 кнопка «пианино» найдена',false,'');
    check('ошибок JS нет',errs.length===0,errs.join(' | '));
    report({ok:true,results:results,info:info});
  }catch(e){report({ok:false,error:String(e&&e.stack||e),results:results,info:info})}
})();
