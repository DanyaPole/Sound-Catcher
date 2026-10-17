/* Страничная часть теста этапа 5. #sa-test&run=polish
   Без флага — производительность, число эх, экспорт картины. С флагом --force-prefers-reduced-motion — «уменьшить движение». */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return document.getElementById(id)};
  try{
    var T=window.__SA.test,sr=44100,n=Math.round(sr*3),L=new Float32Array(n),i;
    for(i=0;i<n;i++){var t=i/sr,f=300+500*(t/3);L[i]=0.6*Math.sin(2*Math.PI*f*t)*Math.exp(-4*(t%0.5))}
    T.load([L,new Float32Array(L)],sr);T.fx([]);T.out(1,0);
    $('gate').classList.add('hide');T.ui();
    var rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(!rm){
      /* P0. пока звук ничего не нарисовал, «поделиться картиной» подсказывает, а не отдаёт пустую картинку */
      window.__dl=null;
      HTMLAnchorElement.prototype.click=function(){window.__dl={href:this.href,name:this.download}};
      try{navigator.share=undefined}catch(e){}
      T.world.set(true);await sleep(250);
      var KEEP0=T.keepOk();
      $('shareArt').click();await sleep(300);
      check('P0 пока картины нет, «поделиться» подсказывает проиграть звук',!KEEP0&&!window.__dl&&/проиграй/.test($('msg').textContent),'');
      T.world.set(false);
      /* P1. стоимость кадра мира со всем сразу: эффекты, холст эха, эхо в звуке, звук рисует */
      T.world.set(true);await sleep(250);
      document.querySelector('#ecPre [data-pre=rain]').click();
      $('artistSw').click();
      T.fx([['echo',2],['cave',2],['water',1]]);
      T.world.play();
      var costs=[],t0=performance.now();
      while(performance.now()-t0<3200){await sleep(100);costs.push(T.cost())}
      var mean=costs.reduce(function(a,b){return a+b},0)/costs.length,mx=Math.max.apply(null,costs);
      check('P1 кадр мира со всем сразу укладывается в бюджет (среднее < 8 мс)',mean<8,'среднее '+mean.toFixed(2)+' мс, пик '+mx.toFixed(2)+' мс (headless, программная отрисовка)');

      /* P2. число эх под слабый телефон */
      T.world.set(false);
      var def=T.taps();
      T.taps(12);var p12=T.ec.plan?null:null;
      T.world.set(true);await sleep(100);
      T.ec.cv();
      var len12=T.ec.plan()?T.ec.plan().length:-1;
      T.taps(24);var len24=T.ec.plan().length;
      check('P2 число эх регулируется: 12 и 24, по умолчанию '+def,len12>0&&len12<=12&&len24===24,'12 → '+len12+', 24 → '+len24);
      T.taps(def);

      /* P3. экспорт картины */
      T.fx([['echo',2]]);
      window.__dl=null;
      T.world.play();
      await sleep(4200);
      check('P3b когда звук закончился, картина запомнена',T.keepOk(),'');
      $('shareArt').click();
      var w0=performance.now();while(!window.__dl&&performance.now()-w0<4000)await sleep(100);
      var dl=window.__dl,bm=null,fracPaint=0,fracEcho=0,artPng='';
      if(dl){
        var blob=await (await fetch(dl.href)).blob();
        bm=await createImageBitmap(blob);
        var c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;var g=c.getContext('2d');g.drawImage(bm,0,0);
        function bright(x,y,w,h){var d=g.getImageData(x,y,w,h).data,m=0,k;for(k=0;k<d.length;k+=4)if(d[k]+d[k+1]+d[k+2]>330)m++;return m/(d.length/4)}
        artPng=c.toDataURL('image/png');fracPaint=bright(40,190,1000,570);fracEcho=bright(188,790,704,440);
      }
      check('P4 картина сохранена как PNG 1080×1350 с именем zvukolovka-kartina.png',!!dl&&dl.name==='zvukolovka-kartina.png'&&bm&&bm.width===1080&&bm.height===1350,dl?dl.name+' '+(bm?bm.width+'×'+bm.height:''):'не скачалось');
      check('P4b в картине звука есть нарисованное (яркие пиксели)',fracPaint>0.01,'яркая доля '+(fracPaint*100).toFixed(1)+'%');
      check('P4c в картине есть холст эха (режим включён)',fracEcho>0.001,'яркая доля '+(fracEcho*100).toFixed(2)+'%');
      T.world.set(false);
    }else{
      /* P5. «уменьшить движение»: чернильный переход заменён затемнением, анимации плиток отключены, фон не плывёт */
      check('P5 система просит меньше движения (медиа-запрос сработал)',true,'');
      $('portal').click();
      await sleep(60);
      var ink=document.querySelector('.ink');
      check('P5b переход в мир — затемнение, а не растекание чернил',!!ink&&ink.classList.contains('still'),ink?ink.className:'нет элемента');
      await sleep(900);
      check('P5c мир включился',document.body.classList.contains('world')&&T.world.on(),'');
      check('P5d фон мира не плывёт (режим «спокойный»)',T.still(),'');
      T.fx([['echo',2]]);T.ui();
      var em=document.querySelector('.t.sel .em'),an=em?getComputedStyle(em).animationName:'?';
      check('P5e у выбранной плитки анимации нет',an==='none','animation-name: '+an);
      T.world.play();await sleep(1500);
      var st=T.world.stats();
      check('P5f звук всё равно рисует картину (это данные, а не украшение)',st.painted>0,'закрашено '+st.painted);
      $('portal').click();await sleep(900);
      check('P5g выход из мира работает',!document.body.classList.contains('world'),'');
    }
    await report({ok:true,results:results,png:typeof artPng==='string'?artPng:''});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
