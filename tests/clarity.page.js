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
  function pick(id){var gb=D.querySelector('#hist .hs.gift');if(gb)gb.click();else $('demoBtn').click();var b=D.querySelector('#dpGrid [data-demo='+id+']');if(b)b.click()}
  function calm(){return !!D.querySelector('#now .chip.calm')}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}');localStorage.removeItem('zv-curves');localStorage.removeItem('zv-echo')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    /* ошибки JavaScript в приложении за весь прогон */
    var errs=[];W.addEventListener('error',function(e){errs.push(String(e.message||e))});W.addEventListener('unhandledrejection',function(e){errs.push('promise: '+String(e.reason&&e.reason.message||e.reason))});
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

    /* ---- шаг 2: ↶ ↷ и сравнение ---- */
    var C=T.clar;
    function fxk(){return [].map.call(D.querySelectorAll('#grid .t.sel'),function(t){return t.getAttribute('data-id')}).join(',')}
    await sleep(700);
    var h0n=C.his().past;
    D.querySelector('#grid .t[data-id=echo]').click();await sleep(800);P.stop();
    D.querySelector('#grid .t[data-id=cave]').click();await sleep(800);P.stop();
    check('R1 два нажатия — два шага истории, ↶ доступна',C.his().past===h0n+2&&!$('undo').disabled&&$('redo').disabled,JSON.stringify(C.his()));
    $('undo').click();await sleep(100);P.stop();
    check('R2 ↶ — снова Эхо',fxk()==='echo'&&!$('redo').disabled,fxk());
    $('undo').click();await sleep(100);P.stop();
    check('R3 ↶ ещё раз — без эффектов',fxk()==='orig'&&calm(),fxk());
    $('redo').click();await sleep(100);P.stop();
    check('R4 ↷ — снова Эхо',fxk()==='echo',fxk());
    var mx=$('mix'),before=C.his().past;
    [90,80,70,60].forEach(function(v){mx.value=v;mx.oninput()});mx.onchange();await sleep(900);P.stop();
    check('R5 ползунок «сухо–мокро» протянули — это один шаг',C.his().past===before+1&&P.mix()===0.6,(C.his().past-before)+' шаг(а), MIX '+P.mix());
    $('undo').click();await sleep(100);P.stop();
    check('R6 ↶ возвращает ползунок',P.mix()===1&&+mx.value===100,'MIX '+P.mix());
    T.slices.set({n:5,mode:'pre',order:[4,3,2,1,0],rev:[false,false,false,false,false]});await sleep(900);
    T.notes.tab();
    D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));await sleep(100);P.stop();
    check('R7 Ctrl+Z отменяет и нарезку',!T.slices.state().on,JSON.stringify(T.slices.state().order));
    /* сравнение */
    $('ab').click();await sleep(150);
    var abOn=C.ab(),lbl=D.querySelector('#now .lbl').textContent,dim=$('nowRow').classList.contains('ab'),pl=P.state().on;
    check('R8 ⇄ — «как было»: кнопка жёлтая, строка бледнеет, звук играет',abOn&&dim&&/как было/.test(lbl)&&pl&&$('ab').getAttribute('aria-pressed')==='true',lbl);
    var hb=C.his().past;
    $('ab').click();await sleep(150);P.stop();
    check('R9 ⇄ ещё раз — с эффектами; сравнение не пишет в историю',!C.ab()&&C.his().past===hb,'');
    $('ab').click();await sleep(100);D.querySelector('#grid .t[data-id=low]').click();await sleep(400);P.stop();
    check('R10 нажал эффект во время сравнения — сравнение само выключилось',!C.ab()&&!$('nowRow').classList.contains('ab'),'');
    /* быстрые разные действия — отдельные шаги: новое касание закрепляет прошлое */
    await sleep(700);var hp0=C.his().past,t1=D.querySelector('#grid .t[data-id=robot]'),t2=D.querySelector('#grid .t[data-id=trem]');
    t1.dispatchEvent(new W.PointerEvent('pointerdown',{bubbles:true}));t1.click();await sleep(60);
    t2.dispatchEvent(new W.PointerEvent('pointerdown',{bubbles:true}));t2.click();await sleep(800);P.stop();
    check('R12 два быстрых нажатия подряд — два шага (↶ отменяет только последнее)',C.his().past===hp0+2,(C.his().past-hp0)+' шага');
    T.load([A],sr);await sleep(400);
    check('R11 новый звук — история чистая',C.his().past===0&&$('undo').disabled,JSON.stringify(C.his()));
    T.fx([]);T.ui();await sleep(400);

    /* ---- шаг 4: демо и подписи 🎲 ---- */
    /* большая кнопка демо — пока звука нет; потом — плитка «🎁 готовые» в «Мои звуки» */
    D.body.classList.remove('ready');var db=$('demoBtn'),dr=db.getBoundingClientRect(),rr=$('rec').getBoundingClientRect();D.body.classList.add('ready');
    var gift=D.querySelector('#hist .hs.gift');
    check('D1c звук есть — большой кнопки нет, а в «Мои звуки» плитка «🎁 готовые», без пустых «пусто»',W.getComputedStyle(db).display==='none'&&!!gift&&!D.querySelector('#hist .hs.empty'),'');
    check('D1 на главном экране под кнопкой записи — «🐦 Попробовать без микрофона»',dr.height>=44&&dr.top>rr.bottom&&dr.top-rr.bottom<200&&/без микрофона/.test(db.textContent),Math.round(dr.top-rr.bottom)+' px ниже записи');
    var g0=T.slices.src();gift.click();await sleep(100);
    var dp=$('demoPick'),nb=D.querySelectorAll('#dpGrid .dpb').length;
    check('D1b «Попробовать» открывает окно: 9 готовых звуков',!dp.hidden&&nb===9,nb+' звуков');
    D.querySelector('#dpGrid [data-demo=bird]').click();await sleep(300);P.stop();
    check('D2 демо загружает птичку (2,4 с) и показывает результат',T.slices.src()!==g0&&Math.abs(T.slices.src().duration-2.4)<0.01&&$('fx').classList.contains('show'),T.slices.src().duration.toFixed(2)+' с');
    var sb=$('surprise');
    check('D3 🎲 Сюрприз подписан, а в описании — что запись не меняется',/Сюрприз: всё случайно/.test(sb.textContent)&&/запись не меняется/.test(sb.getAttribute('aria-label'))&&sb.getBoundingClientRect().height>=44,sb.textContent);
    sb.click();await sleep(200);P.stop();
    check('D4 после 🎲 сказано: «запись та же, ↶ вернёт»',/запись та же, ↶ вернёт/.test($('msg').textContent),$('msg').textContent);
    check('D5 кнопки 🎲 подписаны, что именно меняют',/Случайные эффекты/.test($('fxDice').getAttribute('aria-label'))&&/сухо–мокро и температура/.test($('toolDice').getAttribute('aria-label'))&&/эффекты/.test($('fxDice').textContent),'');
    check('D6 подсказка: что хранится в «Мои звуки» и как сохранить с эффектами',/без эффектов/.test($('saveTip').textContent)&&/📤/.test($('saveTip').textContent),'');
    $('gate').classList.remove('hide');await sleep(50);
    var gd=$('gateDemo'),gr=gd.getBoundingClientRect();
    check('D7 и на экране «Разреши микрофон» есть «Попробовать без микрофона»',gr.height>=44&&gr.bottom<=812,Math.round(gr.top)+'–'+Math.round(gr.bottom)+' px');
    gd.click();await sleep(100);D.querySelector('#dpGrid [data-demo=bird]').click();await sleep(300);P.stop();
    check('D8 оттуда сразу птичка, экран микрофона закрыт',$('gate').classList.contains('hide')&&Math.abs(T.slices.src().duration-2.4)<0.01,'');
    T.load([A],sr);T.fx([]);P.mix(1);T.out(1,0);T.ui();await sleep(400);

    /* ---- шаг 5: запись ---- */
    var md=W.navigator.mediaDevices,gum=md.getUserMedia.bind(md),asked=null;
    md.getUserMedia=function(c){asked=c;return gum(c)};
    W.scrollTo(0,0);$('rec').click();
    var seen=0,maxW=0;
    for(i=0;i<16;i++){await sleep(100);var lv=$('lvl');if(W.getComputedStyle(lv).display!=='none'){seen++;maxW=Math.max(maxW,+lv.getAttribute('aria-valuenow'))}}
    check('M1 запись без автоусиления браузера (autoGainControl: false)',asked&&asked.audio&&asked.audio.autoGainControl===false,JSON.stringify(asked&&asked.audio));
    check('M2 во время записи виден настоящий уровень из микрофона',seen>=10&&maxW>0,'видно '+seen+' кадров, уровень до '+maxW+'%');
    $('rec').click();
    var got=false;for(i=0;i<60&&!got;i++){await sleep(100);got=T.player.state().on||$('fx').classList.contains('show')&&!D.body.classList.contains('recording')}
    P.stop();
    var sb2=T.slices.src(),pk=0,d2=sb2.getChannelData(0);for(i=0;i<d2.length;i++)pk=Math.max(pk,Math.abs(d2[i]));
    check('M3 запись выровнена до пика 0,7 (не 0,9), усиление не больше ×3',got&&pk<=0.7001&&T.rec.gain()<=3,'пик '+pk.toFixed(3)+', усиление ×'+T.rec.gain().toFixed(2)+' · '+$('msg').textContent);
    var R=T.rec,t=10000;R.reset(t);
    var j1=R.judge(0.001,t+800),j2=R.judge(0.001,t+1600),j3=R.judge(0.2,t+1700),j4=R.judge(0.99,t+1800);
    check('M4 тишина дольше 1,5 с — «очень тихо», голос — снова хорошо, почти потолок — «очень громко»',j1===''&&j2==='quiet'&&j3===''&&j4==='loud',[j1,j2,j3,j4].join(','));
    check('M5 тексты подсказок понятны',/громче или поднеси/.test(R.say.quiet)&&/отодвинь/.test(R.say.loud),'');
    T.load([A],sr);T.fx([]);P.mix(1);T.out(1,0);T.ui();await sleep(400);

    /* ---- шаг 6: «Чистый звук» ---- */
    pick('bird');await sleep(300);P.stop();
    var N=T.notes,runs=N.runs();N.set(1,2);var k0=N.key();
    $('chipClean').click();await sleep(300);P.stop();
    check('C1 «Чистый звук» не стирает правку ноты (Соль +2 осталась)',N.key()!==''&&N.edits()[1]===2&&/Чистый/.test(chips().join('|')),k0+' → '+N.key()+' · '+$('msg').textContent);
    $('chipClean').click();await sleep(300);P.stop();
    check('C2 и обратно — правка на месте',N.edits()[1]===2,JSON.stringify(N.edits()));
    /* тихий голос + сильный гул 50 Гц + шум: раньше «чистка» выравнивала до 0,9 (×4) */
    var L2=Math.round(sr*1.2),Z=new Float32Array(L2),seed=1;
    for(i=0;i<L2;i++){seed=(seed*16807)%2147483647;var on=i>sr*0.2&&i<sr*1.0?1:0;Z[i]=0.2*on*Math.sin(2*Math.PI*300*i/sr)+0.3*Math.sin(2*Math.PI*50*i/sr)+0.02*(seed/1073741823.5-1)}
    T.load([Z],sr);T.ui();await sleep(200);
    function pkOf(b){var d=b.getChannelData(0),m=0;for(var q=0;q<d.length;q++)m=Math.max(m,Math.abs(d[q]));return m}
    var p0=pkOf(T.slices.src());
    $('chipClean').click();await sleep(400);P.stop();
    var p1=pkOf(T.slices.src());
    check('C3 «Чистый звук» не громче исходной записи (раньше — до 0,9)',p1<=p0*1.001&&p1>0.05,'пик '+p0.toFixed(3)+' → '+p1.toFixed(3));
    $('chipClean').click();await sleep(200);P.stop();
    /* выход не сплющивает звук: у птички громкое начало ноты и тихий хвост остаются в той же пропорции */
    pick('bird');await sleep(300);P.stop();
    var bs=T.slices.src(),bo=await T.render();
    function seg(b,a,e){var d=b.getChannelData(0),r=b.sampleRate,q,s2=0,n=0;for(q=Math.round(a*r);q<Math.round(e*r);q++){s2+=d[q]*d[q];n++}return Math.sqrt(s2/n)}
    /* у компрессора есть своя задержка — сначала находим её по совпадению волны (0–20 мс) */
    var ds=bs.getChannelData(0),dO=bo.getChannelData(0),rate=bs.sampleRate,lag=0,bc=-1e9,q,z;
    for(z=0;z<Math.round(rate*0.02);z++){var cc=0;for(q=Math.round(rate*0.05);q<Math.round(rate*0.15);q++)cc+=ds[q]*dO[q+z];if(cc>bc){bc=cc;lag=z}}
    var lt=lag/rate,ri=seg(bs,0.02,0.2)/seg(bs,0.2,0.27),ro=seg(bo,0.02+lt,0.2+lt)/seg(bo,0.2+lt,0.27+lt),dB=20*Math.log10(ro/ri);
    check('X1 выход не сплющивает: начало и хвост ноты в той же пропорции (±1 дБ)',Math.abs(dB)<1,'задержка '+(lt*1000).toFixed(1)+' мс; было '+ri.toFixed(2)+', на выходе '+ro.toFixed(2)+' ('+dB.toFixed(1)+' дБ)');
    T.fx([['rock',3],['echo',3]]);T.out(2,0);
    var hot=await T.render(),hp=0,hd=hot.getChannelData(0);for(i=0;i<hd.length;i++)hp=Math.max(hp,Math.abs(hd[i]));
    check('X2 громкость 200% + Рок + Эхо: всё равно не выше 1 (мягкий потолок)',hp<=1&&hp>0.85,'пик '+hp.toFixed(3));
    T.load([A],sr);T.fx([]);P.mix(1);T.out(1,0);T.ui();await sleep(400);

    /* ---- шаг 7: готовые звуки ---- */
    var SECS={bird:2.4,piano:3.6,accordion:3,jaw:2.6,cat:2.4,dog:1.6,cow:2.1,frog:1.5,hen:1.6},bad7=[],info=[];
    for(var id in SECS){
      pick(id);await sleep(150);P.stop();
      var b7=T.slices.src(),d7=b7.getChannelData(0),pk7=0,e7=0,nan=false;
      for(i=0;i<d7.length;i++){var v7=d7[i];if(!isFinite(v7))nan=true;pk7=Math.max(pk7,Math.abs(v7));e7+=v7*v7}
      var rm7=Math.sqrt(e7/d7.length);info.push(id+' '+pk7.toFixed(2)+'/'+rm7.toFixed(3));
      if(nan||Math.abs(pk7-0.7)>0.001||rm7<0.02||Math.abs(b7.duration-SECS[id])>0.01||!$('demoPick').hidden)bad7.push(id);
    }
    check('G1 все 9 готовых звуков: звучат, без NaN, выровнены до 0,7, нужной длины',!bad7.length,bad7.length?'плохо: '+bad7.join(','):info.join(' · '));
    pick('piano');await sleep(150);P.stop();
    var pr=T.notes.runs().map(function(r){return r.m});
    /* одинаковые ноты подряд вкладка «Ноты» показывает одной нотой: Ля×4 → Ля, Фа×2 → Фа */
    check('G2 пианино играет «Во поле берёза»: Ля Соль Фа Ми Ре',pr.join(',')==='69,67,65,64,62',pr.join(','));
    pick('accordion');await sleep(150);P.stop();
    var ar=T.notes.runs().map(function(r){return r.m});
    check('G3 гармошка: До Ми Соль … До',ar[0]===72&&ar[1]===76&&ar[2]===79&&ar[ar.length-1]===72,ar.join(','));
    T.load([A],sr);T.fx([]);P.mix(1);T.out(1,0);T.ui();await sleep(400);
    W.__png=null;

    check('Z1 за весь прогон ни одной ошибки JavaScript',!errs.length,errs.slice(0,3).join(' | '));
    await report({ok:true,results:results,png:W.__png});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
