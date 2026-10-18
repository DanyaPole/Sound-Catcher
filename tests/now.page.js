/* Z4c: строка «Звучит: N ▾». #sa-test&run=now. Ширины 320, 375, 412 (iframe) */
(async function(){
  var results=[];
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
    for(var wi=0;wi<3;wi++){
      var WID=[320,375,412][wi],tag=WID+' px: ';
      var fr=document.createElement('iframe');
      fr.style.cssText='position:fixed;left:0;top:0;width:'+WID+'px;height:812px;border:0';fr.src='/index.html#sa-test';
      document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
      var W=fr.contentWindow,D=fr.contentDocument,$=function(id){return D.getElementById(id)};
      var errs=[];W.addEventListener('error',function(e){errs.push(String(e.message||e))});
      var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
      var T=W.__SA.test,P=T.player,sr=44100,tone=new Float32Array(sr),i;
      for(i=0;i<sr;i++)tone[i]=0.4*Math.sin(2*Math.PI*300*i/sr);
      T.load([tone],sr);T.ui();await sleep(500);
      var btn=$('nowBtn'),list=$('nowList'),row=$('nowRow'),dock=$('dock');
      function vis(el){return !el.hidden&&W.getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0}
      function r(el){return el.getBoundingClientRect()}
      function oneRow(){
        var ys=['undo','redo','now','resetAll'].map(function(id){var q=r($(id));return q.top+q.height/2});
        return Math.max.apply(null,ys)-Math.min.apply(null,ys)<=3&&r(row).height<=64;
      }
      function noClip(){
        var b=r(btn),ok=btn.scrollWidth<=btn.clientWidth+1&&btn.scrollHeight<=btn.clientHeight+1;
        Array.prototype.forEach.call(btn.querySelectorAll('span'),function(s){var q=r(s);if(q.left<b.left-0.5||q.right>b.right+0.5||q.top<b.top-0.5||q.bottom>b.bottom+0.5)ok=false});
        return ok;
      }
      function noHScroll(){return D.documentElement.scrollWidth<=WID&&row.scrollWidth<=row.clientWidth+1&&dock.scrollWidth<=dock.clientWidth+1}
      function layout(name){
        check(tag+name+': одна строка ↶ ↷ счётчик ↺',oneRow(),'высота строки '+Math.round(r(row).height));
        check(tag+name+': кнопка-счётчик не обрезана',noClip(),btn.textContent+' '+btn.scrollWidth+'/'+btn.clientWidth);
        check(tag+name+': нет горизонтальной прокрутки',noHScroll(),D.documentElement.scrollWidth+' / строка '+row.scrollWidth+'>'+row.clientWidth);
        check(tag+name+': цели ≥ 44 px (↶ ↷ счётчик ↺)',['undo','redo','nowBtn','resetAll'].every(function(id){var q=r($(id));return q.width>=43.5&&q.height>=43.5}));
      }

      /* 0 изменений */
      check(tag+'нет изменений: «Звучит: как было»',/^Звучит: как было/.test(btn.textContent)&&btn.getAttribute('aria-label')==='Звучит: как было',btn.getAttribute('aria-label'));
      layout('0 изменений');
      check(tag+'aria-expanded=false, aria-controls указывает на список',btn.getAttribute('aria-expanded')==='false'&&btn.getAttribute('aria-controls')==='nowList'&&!!list);

      /* 7 изменений */
      T.fx([['echo',2],['robot',1],['ufo',3]]);P.mix(0.4);T.out(0.5,0.5);D.querySelector('#temp').value=50;
      T.slices.set({n:4,mode:'pre',order:[1,0,2,3],rev:[false,false,false,false]});
      await sleep(600);
      check(tag+'счётчик показывает число изменений',/Звучит: 7/.test(btn.textContent)&&btn.getAttribute('aria-label')==='Звучит: 7',btn.getAttribute('aria-label'));
      layout('7 изменений');
      check(tag+'aria-live у контейнера и aria-label у «Что сейчас звучит» на месте',$('now').getAttribute('aria-live')==='polite'&&!!$('now').getAttribute('aria-label'));

      /* список */
      check(tag+'список по умолчанию закрыт',!vis(list));
      btn.click();await sleep(150);
      check(tag+'открыт: aria-expanded=true',vis(list)&&btn.getAttribute('aria-expanded')==='true');
      check(tag+'фокус ушёл в список (на плашку)',list.contains(D.activeElement)&&D.activeElement.classList.contains('chip'),D.activeElement&&D.activeElement.className);
      var chips=Array.prototype.slice.call(list.querySelectorAll('.chip')),lr=r(list);
      check(tag+'плашек 7, у каждой aria-label «Выключить: …»',chips.length===7&&chips.every(function(c){return /^Выключить: /.test(c.getAttribute('aria-label'))}),chips.length+'');
      check(tag+'список внутри экрана, не прокручивается вбок',lr.left>=0&&lr.right<=WID&&list.scrollWidth<=list.clientWidth+1,Math.round(lr.left)+'..'+Math.round(lr.right)+' / '+list.scrollWidth+'>'+list.clientWidth);
      check(tag+'ни одна плашка не обрезана (целиком внутри списка), высота ≥ 44',chips.every(function(c){var q=r(c);return q.left>=lr.left-0.5&&q.right<=lr.right+0.5&&q.height>=43.5&&c.scrollWidth<=c.clientWidth+1}));
      check(tag+'строка в панели осталась одной при открытом списке',oneRow()&&noHScroll());
      D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(100);
      check(tag+'Esc закрывает, фокус вернулся на счётчик',!vis(list)&&D.activeElement===btn&&btn.getAttribute('aria-expanded')==='false');
      btn.click();await sleep(100);
      check(tag+'повторное нажатие: открыт',vis(list));
      btn.click();await sleep(100);
      check(tag+'повторное нажатие: закрыт, фокус на счётчике',!vis(list)&&D.activeElement===btn);

      /* касание вне дока, ставшее прокруткой (палец сдвинулся / pointercancel): список остаётся открытым */
      btn.click();await sleep(100);
      var tl=D.querySelector('#grid .t[data-id=low]');
      function pev(el,type,o){el.dispatchEvent(new W.PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true,pointerId:7,clientX:o.x||0,clientY:o.y||0}))}
      pev(tl,'pointerdown',{x:40,y:500});pev(tl,'pointermove',{x:40,y:540});pev(tl,'pointerup',{x:40,y:540});await sleep(150);
      check(tag+'касание вне дока со сдвигом (прокрутка): список остался открытым',vis(list));
      pev(tl,'pointerdown',{x:40,y:500});pev(tl,'pointercancel',{x:40,y:540});await sleep(150);
      check(tag+'касание вне дока с pointercancel (браузер начал прокрутку): список остался открытым',vis(list));
      /* касание вне дока: закрывает и не доходит до плиток */
      var tile=D.querySelector('#grid .t[data-id=low]'),l0=tile.getAttribute('data-l');
      pev(tile,'pointerdown',{x:40,y:500});pev(tile,'pointerup',{x:40,y:500});
      tile.click();await sleep(150);P.stop();
      check(tag+'касание вне дока закрыло список и не нажало плитку',!vis(list)&&tile.getAttribute('data-l')===l0,'data-l '+l0+'→'+tile.getAttribute('data-l'));
      tile.click();await sleep(150);P.stop();
      check(tag+'следующее касание плитки работает как обычно',tile.getAttribute('data-l')!==l0);
      tile.click();tile.click();tile.click();await sleep(300);P.stop();/* вернуть эффект в «выкл» не нужно: следим только за числом ниже */

      /* ✕ на плашке */
      T.fx([['echo',2],['robot',1],['ufo',3]]);await sleep(500);
      btn.click();await sleep(150);
      var n0=list.querySelectorAll('.chip:not(.calm)').length;
      list.querySelector('.chip').click();await sleep(400);P.stop();
      var n1=list.querySelectorAll('.chip:not(.calm)').length;
      check(tag+'✕ выключает одну настройку, список остаётся открытым',vis(list)&&n1===n0-1,n0+'→'+n1);
      check(tag+'после ✕ фокус остаётся внутри списка',list.contains(D.activeElement),D.activeElement&&D.activeElement.tagName);
      D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(100);

      /* режим ⇄ */
      var cnt=btn.getAttribute('aria-label').replace(/^\D+/,'');
      $('ab').click();await sleep(300);P.stop();
      check(tag+'⇄: подпись «Сейчас: как было. С эффектами: N»',/^Сейчас: как было\. С эффектами: \d+$/.test(btn.getAttribute('aria-label'))&&/Сейчас: как было/.test(btn.textContent)&&/С эффектами/.test(btn.textContent),btn.getAttribute('aria-label'));
      layout('⇄ закрыто');
      btn.click();await sleep(150);
      var lr2=r(list),chips2=Array.prototype.slice.call(list.querySelectorAll('.chip'));
      check(tag+'⇄ открыто: плашки пунктиром, на нейтральной заливке, не обрезаны',list.classList.contains('ab')&&chips2.length>0&&chips2.every(function(c){var cs=W.getComputedStyle(c),q=r(c);return cs.borderTopStyle==='dashed'&&q.left>=lr2.left-0.5&&q.right<=lr2.right+0.5})&&list.scrollWidth<=list.clientWidth+1);
      check(tag+'⇄ открыто: текст плашек полностью непрозрачен',chips2.every(function(c){var o=1,e=c;while(e&&e.nodeType===1){o*=parseFloat(W.getComputedStyle(e).opacity);e=e.parentNode}return o===1}));
      D.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(100);
      $('ab').click();await sleep(300);P.stop();

      /* ↶ ↷ ↺ */
      check(tag+'↶ ↷ ↺ на месте',!!$('undo')&&!!$('redo')&&!$('resetAll').disabled);
      $('resetAll').click();await sleep(500);P.stop();
      check(tag+'↺ сбрасывает всё: «Звучит: как было»',/^Звучит: как было/.test(btn.textContent)&&$('resetAll').disabled,btn.textContent);
      layout('после ↺');

      check(tag+'ошибок JS нет',errs.length===0,errs.join(' | '));
      fr.remove();
    }
    report({ok:true,results:results});
  }catch(e){report({ok:false,error:String(e&&e.stack||e),results:results})}
})();
