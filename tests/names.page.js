/* Z4a: названия эффектов. #sa-test&run=names (фрейм 375×812) */
(async function(){
  var results=[];
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}');localStorage.removeItem('zv-labels')}catch(e){}
    async function open(){
      var fr=document.createElement('iframe');
      fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
      document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
      var W=fr.contentWindow,D=fr.contentDocument;
      var sp=D.getElementById('splash');if(sp)sp.remove();D.getElementById('gate').classList.add('hide');D.getElementById('tourPick').hidden=true;
      return {fr:fr,W:W,D:D};
    }
    var A=await open(),W=A.W,D=A.D,$=function(id){return D.getElementById(id)};
    var errs=[];W.addEventListener('error',function(e){errs.push(String(e.message||e))});
    var T=W.__SA.test,sr=44100,len=sr,tone=new Float32Array(len),i;
    for(i=0;i<len;i++)tone[i]=0.4*Math.sin(2*Math.PI*300*i/sr);
    T.load([tone],sr);T.ui();
    var tiles=Array.prototype.slice.call(D.querySelectorAll('#grid .t')),echo=D.querySelector('.t[data-id=echo]'),tip=$('fxtip');
    function pe(el,type,o){o=o||{};el.dispatchEvent(new W.PointerEvent(type,{bubbles:type!=='pointerenter'&&type!=='pointerleave',cancelable:true,pointerType:o.pt||'touch',isPrimary:true,clientX:o.x||0,clientY:o.y||0}))}
    function vis(el){return !!el&&!el.hidden&&W.getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0}
    var lvl=function(el){return +el.getAttribute('data-l')};
    function esc(){D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}

    check('24 плитки, у каждой название в aria-label',tiles.length===24&&tiles.every(function(t){return (t.getAttribute('aria-label')||'').length>1}),tiles.length+' плиток');
    check('подсказка по умолчанию скрыта',!vis(tip));

    /* мышь */
    pe(echo,'pointerenter',{pt:'mouse'});await sleep(150);
    check('мышь: сразу не показывает (задержка)',!vis(tip));
    await sleep(500);
    check('мышь: подсказка с названием',vis(tip)&&tip.textContent==='Эхо',tip.textContent);
    check('подсказка у плитки и в экране',(function(){var r=tip.getBoundingClientRect(),t=echo.getBoundingClientRect();return r.left>=0&&r.right<=375&&Math.abs((r.left+r.right)/2-(t.left+t.right)/2)<60&&(r.bottom<=t.top||r.top>=t.bottom)})());
    pe(echo,'pointerleave',{pt:'mouse'});
    check('мышь: ушла — скрылась',!vis(tip));

    /* клавиатура: фокус клавишей показывает подсказку, мышиный фокус — нет; здесь проверяем, что фокус ничего не ломает */
    echo.focus();
    check('клавиатура: фокус не ломается',D.activeElement===echo);
    echo.blur();await sleep(50);
    check('после blur скрыта',!vis(tip));

    /* быстрый тап выбирает эффект, подсказки нет */
    pe(echo,'pointerdown',{x:40,y:400});await sleep(60);pe(echo,'pointerup',{x:40,y:400});echo.click();await sleep(150);
    check('быстрый тап: эффект включён (25%)',lvl(echo)===1,'data-l='+lvl(echo));
    check('быстрый тап: подсказки нет',!vis(tip));
    await sleep(600);
    check('быстрый тап: подсказки нет и позже',!vis(tip));

    /* долгое нажатие: подсказка, выбор не меняется */
    var cave=D.querySelector('.t[data-id=cave]'),was=lvl(cave);
    pe(cave,'pointerdown',{x:40,y:400});await sleep(700);
    check('долгое нажатие: подсказка с названием «Замок»',vis(tip)&&tip.textContent==='Замок',tip.textContent);
    pe(cave,'pointerup',{x:40,y:400});cave.click();await sleep(100);
    check('долгое нажатие: эффект не выбран',lvl(cave)===was,'data-l='+lvl(cave));
    await sleep(1500);
    check('подсказка гаснет после отпускания',!vis(tip));
    /* следующий обычный тап работает (клик не проглочен насовсем) */
    pe(cave,'pointerdown',{x:40,y:400});await sleep(50);pe(cave,'pointerup',{x:40,y:400});cave.click();await sleep(100);
    check('после долгого нажатия обычный тап выбирает',lvl(cave)===1,'data-l='+lvl(cave));

    /* сдвиг пальца — прокрутка, не долгое нажатие */
    var low=D.querySelector('.t[data-id=low]');
    pe(low,'pointerdown',{x:40,y:400});pe(low,'pointermove',{x:40,y:440});await sleep(700);
    check('сдвиг пальца отменяет долгое нажатие',!vis(tip));
    pe(low,'pointercancel',{x:40,y:440});

    /* контекстное меню гасится */
    var ce=new W.Event('contextmenu',{bubbles:true,cancelable:true});low.dispatchEvent(ce);
    check('контекстное меню на плитке отключено',ce.defaultPrevented);

    /* aria с силой */
    var oal=D.querySelector('.t[data-id=orig]').getAttribute('aria-label');
    check('aria-label несёт силу эффекта (Замок 25%)',/^Замок/.test(cave.getAttribute('aria-label'))&&/25%/.test(cave.getAttribute('aria-label')),cave.getAttribute('aria-label'));
    check('выключенная плитка — только название',echo.getAttribute('aria-label')==='Эхо',echo.getAttribute('aria-label'));
    check('aria-label «Как было» — название',/Как было/.test(oal),oal);

    /* подписи по умолчанию выключены */
    var nms=D.querySelectorAll('#grid .t .nm');
    check('подписи: по умолчанию скрыты',nms.length===24&&!D.body.classList.contains('labels')&&Array.prototype.every.call(nms,function(n){return W.getComputedStyle(n).display==='none'}));
    check('подписи: в хранилище ничего',localStorage.getItem('zv-labels')===null);

    /* кнопка ⚙️ */
    var cfg=$('cfg'),portal=$('portal');
    var rc=cfg.getBoundingClientRect(),rp=portal.getBoundingClientRect();
    check('⚙️ в шапке, не меньше соседних',rc.width>=rp.width-0.5&&rc.height>=rp.height-0.5&&rc.width>=44,Math.round(rc.width)+'×'+Math.round(rc.height));
    check('⚙️ не перекрывает соседей и не уходит за экран',rc.right<=rp.left+0.5&&rc.left>=0&&rc.right<=375);
    check('⚙️ имеет aria-label',!!cfg.getAttribute('aria-label'),cfg.getAttribute('aria-label'));
    var panel=$('cfgPick'),sw=$('cfgLabels');
    check('панель по умолчанию закрыта',!vis(panel));
    cfg.click();await sleep(100);
    check('панель открыта, role=dialog',vis(panel)&&panel.getAttribute('role')==='dialog');
    check('фокус внутри панели',panel.contains(D.activeElement),D.activeElement&&D.activeElement.id);
    check('переключатель: role=switch, выключен',sw.getAttribute('role')==='switch'&&sw.getAttribute('aria-checked')==='false');
    check('переключатель ≥ 44 px',sw.getBoundingClientRect().height>=44);
    sw.click();await sleep(100);
    check('включён: класс labels, aria-checked=true',D.body.classList.contains('labels')&&sw.getAttribute('aria-checked')==='true');
    check('сохранено в хранилище',localStorage.getItem('zv-labels')==='1');
    esc();await sleep(100);
    check('Esc закрывает панель',!vis(panel));
    check('фокус вернулся на ⚙️',D.activeElement===cfg);

    /* подписи видны */
    var ok=Array.prototype.every.call(nms,function(n){var r=n.getBoundingClientRect(),t=n.parentNode.getBoundingClientRect();return vis(n)&&n.textContent.length>1&&r.left>=0&&r.right<=375&&Math.abs((r.left+r.right)/2-(t.left+t.right)/2)<2});
    check('подписи: у всех 24 плиток видны, внутри экрана',ok);
    check('подписи: не наезжают на следующий ряд',(function(){var bad=0;tiles.forEach(function(t,k){var n=t.querySelector('.nm').getBoundingClientRect(),nx=tiles[k+4];if(nx&&n.bottom>nx.getBoundingClientRect().top+0.5)bad++});return bad===0})());
    check('нет горизонтальной прокрутки',D.documentElement.scrollWidth<=375,String(D.documentElement.scrollWidth));

    /* Esc гасит подсказку */
    pe(low,'pointerdown',{x:40,y:400});await sleep(700);
    var shown=vis(tip);esc();
    check('Esc гасит подсказку',shown&&!vis(tip));pe(low,'pointerup');

    /* сохранение между запусками */
    A.fr.remove();
    var B=await open();W=B.W;D=B.D;
    check('после перезапуска подписи включены',D.body.classList.contains('labels')&&localStorage.getItem('zv-labels')==='1');
    D.getElementById('cfg').click();await sleep(100);
    check('после перезапуска переключатель отражает состояние',D.getElementById('cfgLabels').getAttribute('aria-checked')==='true');
    D.getElementById('cfgLabels').click();await sleep(50);
    check('выключение тоже сохраняется',!D.body.classList.contains('labels')&&localStorage.getItem('zv-labels')==='0');
    D.getElementById('cfgClose').click();await sleep(50);
    check('✕ закрывает панель',!vis(D.getElementById('cfgPick')));

    check('ошибок JS нет',errs.length===0,errs.join(' | '));
    report({ok:true,results:results});
  }catch(e){report({ok:false,error:String(e&&e.stack||e),results:results})}
})();
