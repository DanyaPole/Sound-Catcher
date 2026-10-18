/* Z4a: контраст подписей под плитками. #sa-test&run=contrast&mode=light|world[&bg=1]
   Страница ставит состояние и присылает прямоугольники подписей; скриншот снимает contrast.js.
   bg=1 — подписи прозрачные: на снимке остаётся только фон под ними. */
(async function(){
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    var world=/mode=world/.test(location.hash),bg=/bg=1/.test(location.hash);
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
})();
