/* Понятность: «Звучит», отмена, сравнение, одно место для рисования, демо, запись, чистый звук. #sa-test&run=clarity (фрейм 375×812) */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)+':'+ab.length}
  function chips(){return [].map.call(D.querySelectorAll('#now .chip:not(.calm) span'),function(s){return s.textContent})}
  function calm(){return !!D.querySelector('#now .chip.calm')}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}');localStorage.removeItem('zv-curves');localStorage.removeItem('zv-echo')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,P=T.player,sr=44100,i;
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    var len=Math.round(sr*0.8),A=new Float32Array(len);
    for(i=0;i<len;i++)A[i]=0.4*Math.min(1,i/441,(len-1-i)/441)*Math.sin(2*Math.PI*440*i/sr);
    T.load([A],sr);T.ui();T.fx([]);T.out(1,0);await sleep(400);
    var plain=await T.render(),h0=hash(plain);

    /* ---- шаг 1: «Звучит» ---- */
    check('Q1 без эффектов: «Звучит: как было», «Сбросить всё» неактивна',calm()&&!chips().length&&$('resetAll').disabled,chips().join(', '));
    var tile=D.querySelector('#grid .t[data-id=echo]'),other=D.querySelector('#grid .t[data-id=cave]');
    tile.click();await sleep(400);P.stop();
    check('Q2 нажал Эхо — в строке «🏔️ Эхо 25%»',chips().length===1&&/Эхо 25%/.test(chips()[0]),chips().join(', '));
    var oOn=+W.getComputedStyle(tile).opacity,oOff=+W.getComputedStyle(other).opacity,fOff=W.getComputedStyle(other).filter;
    check('Q3 плитки: включённая яркая, выключенная тусклая и серая',oOn===1&&oOff<0.8&&/saturate/.test(fOff),'вкл '+oOn+', выкл '+oOff+' '+fOff);
    var dots=[].filter.call(tile.querySelectorAll('.lv i'),function(x){return W.getComputedStyle(x).backgroundColor!=='rgba(26, 16, 51, 0.18)'}).length;
    check('Q4 у включённой плитки точки уровня (25% — одна)',dots===1,dots+' точек');
    P.mix(0.7);T.out(1,0.5);D.querySelector('#temp').value=50;
    T.slices.set({n:4,mode:'pre',order:[1,0,2,3],rev:[false,false,false,false]});await sleep(400);
    var c=chips();
    check('Q5 видны все настройки: эффект, сухо–мокро, температура, нарезка',c.length===4&&c.some(function(x){return /💧 70%/.test(x)})&&c.some(function(x){return /🌡️/.test(x)})&&c.some(function(x){return /✂️ 4/.test(x)}),c.join(' | '));
    D.querySelector('#now .chip').click();await sleep(300);P.stop();
    check('Q6 ✕ на чипе выключает только его',T.player.state().fx===0&&chips().length===3&&!tile.classList.contains('sel'),chips().join(' | '));
    $('resetAll').click();await sleep(300);P.stop();
    var rs=await T.render();
    check('Q7 «Сбросить всё» — звук бит в бит как без настроек',calm()&&hash(rs)===h0&&!T.slices.state().on,hash(rs)+' / '+h0);
    W.scrollTo(0,D.documentElement.scrollHeight);await sleep(200);
    var nr=$('nowRow').getBoundingClientRect(),tb=$('tbar').getBoundingClientRect();
    check('Q8 строка «Звучит» прилипает вместе с плеером',nr.top>=0&&nr.top<160&&tb.top>=0&&tb.height<=90,'строка '+Math.round(nr.top)+' px, плеер '+Math.round(tb.height)+' px');
    W.scrollTo(0,0);
    W.__png=null;

    await report({ok:true,results:results,png:W.__png});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
