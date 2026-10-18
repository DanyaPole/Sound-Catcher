/* Z4a: контраст подписей под плитками. #sa-test&run=contrast&mode=light|world[&bg=1]
   Страница ставит состояние и присылает прямоугольники подписей; скриншот снимает contrast.js.
   bg=1 — подписи прозрачные: на снимке остаётся только фон под ними. */
(async function(){
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    var world=/mode=world/.test(location.hash),bg=/bg=1/.test(location.hash);
    if(/now=1/.test(location.hash))return await nowMode(world);
    var fr=document.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:3000px;border:0;z-index:99999;background:#fff';fr.src='/index.html#sa-test';
    document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(400);
    var W=fr.contentWindow,D=fr.contentDocument,$=function(id){return D.getElementById(id)};
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    var T=W.__SA.test,sr=44100,a=new Float32Array(sr),i;
    for(i=0;i<sr;i++)a[i]=0.4*Math.sin(2*Math.PI*300*i/sr);
    T.load([a],sr);T.ui();
    if(world){T.world.set(true);await sleep(600);$('tourPick').hidden=true}
    D.body.classList.add('labels');
    var realColor=W.getComputedStyle(D.querySelector('.t .nm')).color;
    var st=D.createElement('style');st.textContent='#tourPick{display:none!important}*{animation:none!important;transition:none!important}'+(bg?'.t .nm{color:transparent!important}':'');D.head.appendChild(st);
    /* плитки не нажимаем: от клика меняется строка «Звучит» и сетка уезжает между замером и снимком */
    /* замер — в самом конце бюджета виртуального времени, прямо перед снимком: раскладка к этому моменту устоялась */
    while(performance.now()<5750)await sleep(50);
    W.scrollTo(0,0);await sleep(300);
    var out=[];
    Array.prototype.forEach.call(D.querySelectorAll('#grid .t'),function(t){
      var n=t.querySelector('.nm'),r=n.getBoundingClientRect(),cs=W.getComputedStyle(n);
      var top=D.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      out.push({id:t.getAttribute('data-id'),x:r.left,y:r.top,w:r.width,h:r.height,color:realColor,op:cs.opacity,
        open:!!top&&!!top.closest('#fx'),top:top?(top.tagName+'#'+top.id+'.'+top.className):null,sel:t.classList.contains('sel')});
    });
    report({ok:true,world:world,bg:bg,iw:W.innerWidth,ih:W.innerHeight,dpr:W.devicePixelRatio,labels:out,
      effOpacity:Array.prototype.map.call(D.querySelectorAll('#grid .t .nm'),function(n){var o=1,e=n;while(e&&e.nodeType===1){o*=parseFloat(W.getComputedStyle(e).opacity);e=e.parentNode}return o})});
  }catch(e){report({ok:false,error:String(e&&e.stack||e)})}

  /* строка «Звучит»: контраст по вычисленным стилям (фон кнопок и списка непрозрачный; слои с прозрачностью складываются) */
  async function nowMode(world){
    var fr=document.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(400);
    var W=fr.contentWindow,D=fr.contentDocument,$=function(id){return D.getElementById(id)};
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    var T=W.__SA.test,sr=44100,a=new Float32Array(sr),i;
    for(i=0;i<sr;i++)a[i]=0.4*Math.sin(2*Math.PI*300*i/sr);
    T.load([a],sr);T.ui();
    if(world){T.world.set(true);await sleep(600);$('tourPick').hidden=true}
    T.fx([['echo',2],['robot',1]]);T.player.mix(0.4);await sleep(600);
    function rgba(c){var m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c);return m?[+m[1],+m[2],+m[3],m[4]==null?1:+m[4]]:[0,0,0,0]}
    function over(top,bot){var al=top[3];return [top[0]*al+bot[0]*(1-al),top[1]*al+bot[1]*(1-al),top[2]*al+bot[2]*(1-al),1]}
    function bgOf(el){var layers=[],e=el,base=null;
      while(e&&e.nodeType===1){var c=rgba(W.getComputedStyle(e).backgroundColor);if(c[3]>0)layers.push(c);if(c[3]>=1){base=c;break}e=e.parentNode}
      if(!base){base=[255,255,255,1];layers.push(base)}
      var cur=layers.pop();while(layers.length)cur=over(layers.pop(),cur);return cur}
    function opac(el){var o=1,e=el;while(e&&e.nodeType===1){o*=parseFloat(W.getComputedStyle(e).opacity);e=e.parentNode}return o}
    function lum(c){function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])}
    function ratio(x,y){var p=lum(x),q=lum(y);return (Math.max(p,q)+0.05)/(Math.min(p,q)+0.05)}
    var out=[];
    function meas(name,el){
      var bg=bgOf(el),tc=rgba(W.getComputedStyle(el).color),al=tc[3]*opac(el),txt=over([tc[0],tc[1],tc[2],al],bg);
      out.push({name:name,ratio:ratio(txt,bg),text:'rgb('+txt.map(Math.round).slice(0,3).join(',')+')',bg:'rgb('+bg.map(Math.round).slice(0,3).join(',')+')'});
    }
    var btn=$('nowBtn'),list=$('nowList');
    btn.click();await sleep(200);
    meas('счётчик «Звучит: N»',btn.querySelector('span'));
    meas('значок ▾/▴ счётчика',btn.querySelector('i'));
    meas('плашка: текст',list.querySelector('.chip span'));
    meas('плашка: ✕',list.querySelector('.chip b'));
    $('ab').click();await sleep(400);
    if(list.hidden)btn.click();await sleep(200);
    meas('⇄ счётчик «Сейчас: как было / С эффектами»',btn.querySelector('.nb2 span'));
    meas('⇄ плашка (пунктир, серая заливка): текст',list.querySelector('.chip span'));
    meas('⇄ плашка: ✕',list.querySelector('.chip b'));
    $('ab').click();await sleep(300);
    $('resetAll').click();await sleep(500);
    if(list.hidden)btn.click();await sleep(200);
    meas('плашка «👂 как было» (нет изменений)',list.querySelector('.chip.calm'));
    report({ok:true,now:out,world:world});
  }
})();
