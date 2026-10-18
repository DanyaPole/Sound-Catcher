/* Страничная часть теста раскладки. #sa-test&run=layout
   Приложение открывается во фрейме 375×812 — ширина настоящего телефона (окно headless не бывает уже ~500 px). */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  function vis(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&W.getComputedStyle(el).visibility!=='hidden'}
  function buttons(){return [].filter.call(D.querySelectorAll('button,summary,input[type=range]'),function(b){return vis(b)&&!b.closest('#tour,#tourPick,#gate,#splash')})}
  function name(b){return b.id||b.getAttribute('data-tool')||b.getAttribute('data-paint')||b.getAttribute('data-pre')||b.getAttribute('data-id')||b.className||b.tagName}
  function small(){return buttons().filter(function(b){if(b.type==='range')return false;var r=b.getBoundingClientRect();return r.width<44||r.height<44}).map(function(b){var r=b.getBoundingClientRect();return name(b)+' '+Math.round(r.width)+'×'+Math.round(r.height)})}
  function hit(a,b){return a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1}
  /* круглые кнопки шапки не лежат поверх других элементов ни при какой прокрутке */
  function covered(){
    var top=['portal','help'].map($).filter(vis),bad=[],H=D.documentElement.scrollHeight,y;
    for(y=0;y<H;y+=200){
      W.scrollTo(0,y);
      top.forEach(function(t){
        var tr=t.getBoundingClientRect();
        buttons().concat([].slice.call(D.querySelectorAll('#msg,#ecWrap,.knob,.sw,.sec'))).forEach(function(o){
          if(o===t||o.closest('.bar')||!vis(o))return;
          if(hit(tr,o.getBoundingClientRect()))bad.push(t.id+'/'+name(o)+'@'+y);
        });
      });
    }
    W.scrollTo(0,0);return bad;
  }
  try{
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,sr=44100,n=sr,L=new Float32Array(n),i;
    for(i=0;i<n;i++)L[i]=0.5*Math.sin(2*Math.PI*440*i/sr)*Math.exp(-3*i/sr);
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');
    T.load([L],sr);T.ui();await sleep(200);

    check('L0 значки — файлами, без base64 в странице',!/data:image/.test(D.head.innerHTML)&&!/data:image/.test($('gate').innerHTML),'');
    var m=await fetch('manifest.json').then(function(r){return r.json()}).catch(function(){return null});
    var icons=m?await Promise.all(m.icons.concat([{src:'apple-touch-icon.png'}]).map(function(x){return fetch(x.src).then(function(r){return r.ok})})):[];
    check('L1 манифест и все значки отдаются',m&&m.name==='Звуколовка'&&icons.length===4&&icons.every(Boolean),JSON.stringify(icons));
    check('L2 кнопки шапки в потоке страницы, а не поверх неё',['portal','help'].every(function(id){return W.getComputedStyle($(id)).position!=='fixed'}),'');
    check('L3 обычный экран: кнопки не меньше 44 px',small().length===0,small().join(', '));
    check('L4 обычный экран: ничего не перекрыто',covered().length===0,covered().slice(0,5).join(', '));
    check('L5 обычный экран: нет прокрутки вбок',D.documentElement.scrollWidth<=W.innerWidth,D.documentElement.scrollWidth+' > '+W.innerWidth);

    T.world.set(true);await sleep(400);$('tourPick').hidden=true;
    check('L6 мир: кнопки не меньше 44 px',small().length===0,small().join(', '));
    var cv=covered();
    check('L7 мир: ❓ 🔔 🎨 ничего не перекрывают при прокрутке',cv.length===0,cv.slice(0,5).join(', '));
    check('L8 мир: нет прокрутки вбок',D.documentElement.scrollWidth<=W.innerWidth,D.documentElement.scrollWidth+' > '+W.innerWidth);
    check('L9 мир: настройки для взрослых спрятаны под «Ещё»',!D.querySelector('.ec-more').open&&D.querySelector('.ec-more').getBoundingClientRect().height<60&&D.querySelector('.ec-more').contains($('ecInfl'))&&D.querySelector('.ec-more').contains($('ecBlur')),'высота свёрнутого блока '+Math.round(D.querySelector('.ec-more').getBoundingClientRect().height)+' px');
    var eb=$('echoBox').getBoundingClientRect().height;
    check('L10 мир: холст эха компактный (не выше 1,1 экрана)',eb<=W.innerHeight*1.1,Math.round(eb)+' px при экране '+W.innerHeight);
    var pre=D.querySelectorAll('#ecPre .ecTh').length,pr=$('ecPre').getBoundingClientRect(),th=D.querySelector('#ecPre .ecTh').getBoundingClientRect();
    check('L11 готовые картины — одна лента',pre===7&&th.height<pr.height+1&&$('ecPre').scrollWidth>$('ecPre').clientWidth,pre+' картин');
    /* температура в мире: оттенок полупрозрачный, текст светлый остаётся читаемым */
    var t=$('temp');t.value=80;t.dispatchEvent(new Event('input'));
    var bg=W.getComputedStyle($('tempBox')).backgroundImage;
    check('L12 мир: «Температура» не становится светлой плашкой со светлым текстом',/rgba\(255, 211, 168, 0\.\d+\)/.test(bg)&&W.getComputedStyle($('tempBox')).backgroundColor==='rgba(24, 16, 58, 0.62)',bg.slice(0,90));
    t.value=0;t.dispatchEvent(new Event('input'));
    T.world.set(false);

    await report({ok:true,results:results});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
