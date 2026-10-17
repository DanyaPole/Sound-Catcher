/* Страничная часть теста обучения. #sa-test&run=tour
   Без флага — оба сценария настоящими действиями. С --force-prefers-reduced-motion — проверка анимаций. */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return document.getElementById(id)};
  var q=function(s){return document.querySelector(s)};
  async function until(fn,ms){var t0=performance.now();while(performance.now()-t0<ms){if(fn())return true;await sleep(60)}return !!fn()}
  function pe(type,x,y){
    var r=$('ecTop').getBoundingClientRect();
    $('ecTop').dispatchEvent(new PointerEvent(type,{clientX:r.left+x*r.width,clientY:r.top+y*r.height,bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true}));
  }
  function stroke(x0,y0,x1,y1,n){pe('pointerdown',x0,y0);for(var i=1;i<=n;i++)pe('pointermove',x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);pe('pointerup',x1,y1)}
  function rect(el){var r=el.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}}
  function overlap(a,b){return Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t))}
  /* раскладка шага: бабочка целиком на экране и не закрывает подсвеченное место */
  async function geo(label){
    /* ждём, пока страница доедет до цели и рамка встанет на место */
    var lastY=-1,stable=0,t0=performance.now();
    while(performance.now()-t0<4000){await sleep(120);if(Math.abs(scrollY-lastY)<0.5)stable++;else stable=0;lastY=scrollY;if(stable>=4)break}
    await sleep(500);
    var vw=innerWidth,vh=innerHeight,b=rect(q('.tr-bubble')),ring=q('.tr-ring'),bad=[];
    if(b.l<0||b.r>vw+1||b.t<0||b.b>vh+1)bad.push('бабочка вне экрана');
    if(!ring.classList.contains('none')){var r=rect(ring);if(overlap(b,r)>0)bad.push('бабочка закрывает цель '+Math.round(overlap(b,r))+'px²')}
    var hand=q('.tr-hand');if(!hand.classList.contains('none')){var hh=rect(hand);if(overlap(b,hh)>20)bad.push('бабочка закрывает руку')}
    var rr=rect(ring),sl=T.tour.state().sel,se=sl&&sl.charAt(0)!=='@'?q(sl):null,sr2=se?rect(se):null;check('раскладка: '+label,bad.length===0,(bad.join('; ')||'ок')+' | бабочка '+Math.round(b.t)+'–'+Math.round(b.b)+', цель '+Math.round(rr.t)+'–'+Math.round(rr.b)+', элемент '+sl+' '+(sr2?Math.round(sr2.t)+'–'+Math.round(sr2.b):'-')+', экран '+vh+', прокрутка '+Math.round(scrollY)+'/'+Math.round(document.documentElement.scrollHeight));
  }
  try{
    var T=window.__SA.test,rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');
    T.tour.reset();
    T.ui();

    if(rm){
      T.world.set(true);
      T.tour.start('kid');await sleep(300);
      var a1=getComputedStyle(q('.tr-bf')).animationName,a2=getComputedStyle(q('.tr-ring')).animationName,a3=getComputedStyle(q('.tr-hand')).animationName;
      check('R1 «уменьшить движение»: бабочка, рамка и рука не анимируются',a1==='none'&&a2==='none'&&a3==='none',a1+' / '+a2+' / '+a3);
      check('R2 обучение при этом работает: бабочка с текстом на экране',q('.tr-bt').textContent.length>3,q('.tr-bt').textContent);
      await report({ok:true,results:results});return;
    }

    /* тексты: ребёнку — коротко, взрослому — по делу */
    var kt=T.tour.texts('kid'),at=T.tour.texts('adult');
    function words(s){return s.replace(/[^\wа-яё«»\s]/gi,' ').split(/\s+/).filter(Boolean).length}
    check('U-a тексты малыша короткие (≤ 7 слов)',kt.every(function(t){return words(t)<=7}),kt.map(words).join(','));
    check('U-b тексты взрослого ёмкие (≤ 50 слов)',at.every(function(t){return words(t)<=50}),at.map(words).join(','));

    check('H0 новичку кнопка 🎨 подсвечена и подписана «Нажми!»',q('#portal').classList.contains('hint'),'');
    /* первый вход: сам предлагает обучение */
    T.world.set(true);
    var picked=await until(function(){return T.tour.state().pick},4500);
    check('H1 после входа в мир подсветка кнопки убрана',!q('#portal').classList.contains('hint'),'');
    check('U0 первый вход в мир: предлагает «Малыш» или «Взрослый»',picked&&!!q('.tp-b[data-k=kid]')&&!!q('.tp-b[data-k=adult]'),'');

    /* ---- малыш ---- */
    q('.tp-b[data-k=kid]').click();
    var st=T.tour.state();
    check('K0 выбран «Малыш»: обучение идёт, шагов '+st.n,st.i===0&&st.kind==='kid'&&/kid/.test(st.on),JSON.stringify(st));
    await geo('малыш, шаг 1 (запись)');
    q('#rec').click();await sleep(1400);
    check('K1 пока идёт запись, подсказка меняется на «нажми ещё раз»',/ещё раз/.test(T.tour.state().text),T.tour.state().text);
    q('#rec').click();
    check('K1b после записи — шаг 2 («звук рисует»)',await until(function(){return T.tour.state().i===1},8000),'');
    check('K2 бабочка сама переходит дальше, когда звук отыграл и нарисовал',await until(function(){return T.tour.state().i===2},12000),'');
    await geo('малыш, шаг 3 (коснись экрана)');
    var pc0=T.tour.taps();
    document.body.dispatchEvent(new PointerEvent('pointerdown',{clientX:30,clientY:300,bubbles:true,pointerId:3}));
    document.body.dispatchEvent(new PointerEvent('pointerup',{clientX:30,clientY:300,bubbles:true,pointerId:3}));
    check('K3 касание экрана засчитано (даже без кнопки «Далее»)',await until(function(){return T.tour.state().i===3},4000),'');
    await geo('малыш, шаг 4 (слон)');
    q('#grid .t[data-id=low]').click();
    check('K4 выбрал слона: шаг пройден и звук играет',await until(function(){return T.tour.state().i===4},4000),'');
    await geo('малыш, шаг 5 (нарисуй эхо)');
    stroke(0.3,0.5,0.7,0.45,14);
    check('K5 нарисовал точки: эхо включилось само и слышно',await until(function(){return T.tour.state().i===5&&T.ec.on()},4000),'эхо вкл: '+T.ec.on());
    await geo('малыш, награда');
    check('K6 награда: «Ты художник звука!»',/художник звука/.test(T.tour.state().text),T.tour.state().text);
    q('.tr-act button').click();
    await sleep(200);
    check('K7 после «Играть дальше» обучение закрыто и запомнено',T.tour.state().on===''&&T.tour.saved().kid===1,JSON.stringify(T.tour.saved()));

    /* ---- взрослый ---- */
    /* малыш включил эхо — выключаем, чтобы проверить и этот шаг взрослого */
    if(T.ec.on())q('#artistSw').click();
    q('#help').click();
    check('A0 кнопка ❓ снова открывает выбор',T.tour.state().pick,'');
    q('.tp-b[data-k=adult]').click();
    check('A1 выбран «Взрослый»',T.tour.state().kind==='adult'&&T.tour.state().i===0,'');
    await geo('взрослый, шаг 1 (запись)');
    var demoBtn=q('.tr-act button');
    check('A1b есть кнопка «Готовый звук» (если нет микрофона)',!!demoBtn&&/Готовый/.test(demoBtn.textContent),'');
    demoBtn.click();
    check('A2 готовый звук загружен — шаг 2',await until(function(){return T.tour.state().i===1},5000),'');
    await geo('взрослый, шаг 2 (эффект)');
    q('#grid .t[data-id=echo]').click();
    check('A3 выбрал эффект — шаг 3',await until(function(){return T.tour.state().i===2},4000),'');
    await geo('взрослый, шаг 3 (выключатель)');
    q('#artistSw').click();
    check('A4 включил «Эхо рисую я» — шаг 4',await until(function(){return T.tour.state().i===3},4000),'');
    await geo('взрослый, шаг 4 (холст)');
    q('.tr-act button').click();
    check('A5 «Показать как» выбрало перо и голубую краску',q('#ecTools [data-tool=pen]').classList.contains('on')&&q('#ecPal [data-paint=blue]').classList.contains('on'),'');
    stroke(0.4,0.5,0.4,0.5,1);
    check('A6 голубое перо на холсте — шаг 5',await until(function(){return T.tour.state().i===4},4000),'');
    await geo('взрослый, итог');
    q('.tr-act button').click();await sleep(200);
    check('A7 «Готово»: закрыто и запомнено',T.tour.state().on===''&&T.tour.saved().adult===1,JSON.stringify(T.tour.saved()));

    /* ---- общее поведение ---- */
    T.world.set(false);await sleep(100);T.world.set(true);
    await sleep(2500);
    check('C1 после прохождения заново не навязывается при входе в мир',!T.tour.state().pick&&T.tour.state().on==='','');

    q('#help').click();q('.tp-b[data-k=kid]').click();await sleep(200);
    q('.tr-skip').click();await sleep(100);
    check('C2 «Пропустить» закрывает обучение',T.tour.state().on===''&&T.tour.state().i===-1,'');

    T.tour.fast(1200);
    q('#help').click();q('.tp-b[data-k=kid]').click();
    var stuck=await until(function(){var b=[].slice.call(document.querySelectorAll('.tr-act button')).filter(function(x){return /Пропустить шаг/.test(x.textContent)});return b.length>0},4000);
    check('C3 если застрял, появляется «Пропустить шаг»',stuck,'');
    if(stuck){[].slice.call(document.querySelectorAll('.tr-act button')).filter(function(x){return /Пропустить шаг/.test(x.textContent)})[0].click()}
    check('C3b «Пропустить шаг» ведёт дальше',await until(function(){return T.tour.state().i===1},3000),'');

    T.world.set(false);await sleep(100);
    check('C4 выход из мира во время обучения закрывает его',T.tour.state().on==='','');

    /* перезагрузка в мире: приложение открывается сразу в мире, холст эха и обучение готовы */
    try{localStorage.setItem('zv-world','1')}catch(e){}
    var fr=document.createElement('iframe');fr.src='/index.html';fr.style.cssText='position:fixed;left:-3000px;top:0;width:500px;height:900px;border:0';
    document.body.appendChild(fr);
    await sleep(2500);
    var d=fr.contentDocument,okR=false,info='';
    try{
      var inW=d.body.classList.contains('world'),nb=d.querySelectorAll('#ecTools .ecBtn').length,pw=d.getElementById('ecPaint').width;
      okR=inW&&nb>=8&&pw>100;info='мир '+inW+', кнопок инструментов '+nb+', ширина холста '+pw;
    }catch(e){info=String(e)}
    check('S1 перезагрузка внутри мира: приложение сразу в мире, холст эха инициализирован',okR,info);
    fr.remove();try{localStorage.setItem('zv-world','0')}catch(e){}

    /* ?fresh: новый тестер видит всё как в первый раз, записи не страдают */
    try{localStorage.setItem('zv-world','1');localStorage.setItem('zv-tour','{"seen":1}');localStorage.setItem('zv-echo','x')}catch(e){}
    var f2=document.createElement('iframe');f2.src='/index.html?fresh';f2.style.cssText='position:fixed;left:-3000px;top:0;width:500px;height:900px;border:0';
    document.body.appendChild(f2);await sleep(1800);
    var d2=f2.contentDocument,fk=[localStorage.getItem('zv-world'),localStorage.getItem('zv-tour'),localStorage.getItem('zv-echo')];
    check('F1 ?fresh сбрасывает мир, обучение и холст; адрес очищается',fk.every(function(v){return v===null})&&!d2.body.classList.contains('world')&&d2.getElementById('portal').classList.contains('hint')&&f2.contentWindow.location.search==='','ключи: '+JSON.stringify(fk)+', адрес '+f2.contentWindow.location.search+'|');
    f2.remove();

    await report({ok:true,results:results});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
