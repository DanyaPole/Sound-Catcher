/* Страничная часть теста этапа 3: кисти эффектов, жесты, галерея. #sa-test&run=world3 */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function ptr(type,x,y){document.body.dispatchEvent(new PointerEvent(type,{clientX:x,clientY:y,bubbles:true,pointerId:1,pointerType:'touch'}))}
  try{
    var T=window.__SA.test,sr=44100,n=Math.round(sr*3),L=new Float32Array(n),i;
    for(i=0;i<n;i++){var t=i/sr,f=300+500*(t/3);L[i]=0.6*Math.sin(2*Math.PI*f*t)*Math.exp(-4*(t%0.5))}
    T.load([L,new Float32Array(L)],sr);T.fx([]);T.out(1,0);
    document.getElementById('gate').classList.add('hide');
    T.ui();
    T.world.set(true);
    await sleep(200);

    /* B1. каждый эффект: кисть соответствует его реальным параметрам и картина рисуется */
    var ids=['echo','cave','warp','low','high','rev','robot','trem','ufo','radio','water','rock','chorus','retro','parrot'],bad=[];
    for(i=0;i<ids.length;i++){
      T.fx([[ids[i],3]]);
      T.world.play();
      await sleep(1100);
      var st=T.world.stats(),br=T.brush();
      var ok=st.painted>0&&br;
      var id=ids[i];
      if(ok){
        if(id==='low')ok=br.thick>1&&br.rate<1;
        if(id==='high')ok=br.thick<1&&br.rate>1;
        if(id==='echo')ok=br.echo&&br.echo.delay===0.28;
        if(id==='warp')ok=br.wobble.length===1&&br.wobble[0].hz===2.5;
        if(id==='ufo')ok=br.wobble.length===1&&br.wobble[0].hz===7;
        if(id==='retro')ok=br.grid===12&&br.square;
        if(id==='robot')ok=br.square;
        if(id==='chorus')ok=br.copies.length===3;
        if(id==='parrot')ok=br.dash===0.12;
        if(id==='rev')ok=br.hueFlip&&br.revChunk===0;
        if(id==='trem')ok=br.pulse&&br.pulse.hz===9;
        if(id==='radio')ok=br.sat<40;
        if(id==='water')ok=br.blur>0&&br.sat<92;
        if(id==='rock')ok=br.zig>0;
        if(id==='cave')ok=br.glow>1&&br.cave.len>3;
      }
      if(!ok)bad.push(id+'(закрашено '+st.painted+')');
    }
    check('B1 все 15 эффектов: кисть по реальным параметрам, картина рисуется',bad.length===0,bad.length?'не прошли: '+bad.join(', '):'15 из 15');

    /* B2. эхо: на ударах расходятся круги, в том числе в моменты повторов */
    T.fx([['echo',2]]);T.world.play();
    var maxR=0;
    for(i=0;i<14;i++){await sleep(100);maxR=Math.max(maxR,T.ripples())}
    check('B2 эхо: на ударах появляются круги повторов (3 на удар)',maxR>=3,'одновременно кругов: '+maxR);
    T.fx([]);

    /* B3–B6. фон мира только показывает звук: свайп и касание по нему ничего не меняют и не звучат */
    for(i=0;i<60&&T.ripples()>0;i++)await sleep(100);
    var vol0=T.vol(),t0=T.temp(),r0=T.ripples(),m0=document.getElementById('msg').textContent;
    ptr('pointerdown',100,300);ptr('pointermove',160,305);ptr('pointermove',230,306);ptr('pointerup',230,306);
    ptr('pointerdown',250,500);ptr('pointerup',250,500);
    await sleep(80);
    check('B3 свайп вбок по фону не меняет температуру и громкость',T.temp()===t0&&T.vol()===vol0,'температура '+t0+' → '+T.temp());
    check('B4 касание фона не рисует кругов',T.ripples()===r0,'кругов '+r0+' → '+T.ripples());
    check('B5 под плеером подпись: фон — картина звука, рисовать в рамках',getComputedStyle(document.getElementById('wNote')).display==='block'&&/Рисуй здесь/.test(document.getElementById('wNote').textContent),'');
    var eh=document.getElementById('ecHere'),ew=document.getElementById('ecWrap');
    check('B6 холст эха в пунктирной рамке с ярлыком «✏️ Рисуй здесь»',!!eh&&/Рисуй здесь/.test(eh.textContent)&&/dashed/.test(getComputedStyle(ew).outlineStyle),getComputedStyle(ew).outlineStyle);

    /* B7. картина записи из настоящего спектра: растущий тон — картина идёт вверх */
    var th=T.thumb(),C=36,B=12;
    function peakBand(c){var b=0,m=-1,k;for(k=0;k<B;k++){var v=th[c*B+k];if(v>m){m=v;b=k}}return b}
    check('B7 картина записи: растущий тон 300→800 Гц идёт вверх',th.length===C*B&&peakBand(C-2)>peakBand(2),'полоса в начале '+peakBand(2)+' → в конце '+peakBand(C-2));

    /* B8. запись с поддельного микрофона попадает в галерею с картиной */
    document.getElementById('rec').click();
    await sleep(1800);
    document.getElementById('rec').click();
    await sleep(1200);
    var h=T.hist(),it=h[0],nz=0;
    if(it&&it.th)for(i=0;i<it.th.length;i++)if(it.th[i]>150)nz++;
    check('B8 новая запись в галерее с картиной (есть яркие точки)',!!(it&&it.th&&it.th.length===C*B&&nz>3),'яркие клетки: '+nz);
    var cvs=document.querySelectorAll('#hist .hs canvas');
    var drawn=false;
    if(cvs[0]){var d=cvs[0].getContext('2d').getImageData(0,0,cvs[0].width,cvs[0].height).data,m=0;for(i=0;i<d.length;i+=4)if(d[i]>60||d[i+1]>60)m++;drawn=m>20}
    check('B9 в мире миниатюра записи нарисована цветными пятнами',drawn,'');
    T.world.set(false);
    await sleep(100);
    var ok2=document.querySelectorAll('#hist .hs canvas').length>0;
    check('B10 выход из мира: галерея снова столбиками, без ошибок',ok2,'');

    await report({ok:true,results:results});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
