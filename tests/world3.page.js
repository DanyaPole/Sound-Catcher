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

    /* B3. жест температуры: горизонтальный свайп по пустому месту */
    var vol0=T.vol(),t0=T.temp();
    ptr('pointerdown',100,300);ptr('pointermove',160,305);ptr('pointermove',230,306);
    var hud=document.getElementById('whud').classList.contains('show');
    ptr('pointerup',230,306);
    await sleep(50);
    var t1=T.temp(),sl=+document.getElementById('temp').value;
    check('B3 свайп вправо по пустому месту: звук теплее, ползунок и значение совпадают',t1>t0+0.2&&Math.abs(sl/100-t1)<0.01,'температура '+t0.toFixed(2)+' → '+t1.toFixed(2)+', ползунок '+sl);
    check('B3b во время жеста показана подсказка',hud,'');
    ptr('pointerdown',300,300);ptr('pointermove',200,298);ptr('pointermove',120,296);ptr('pointerup',120,296);
    await sleep(50);
    check('B4 свайп влево: холоднее',T.temp()<t1-0.2,'→ '+T.temp().toFixed(2));
    check('B4b громкость жестом не меняется',T.vol()===vol0,'');

    /* B5. вертикальный свайп — это прокрутка: ни температуры, ни ноты */
    var tt=T.temp(),r0=T.ripples();
    ptr('pointerdown',200,300);ptr('pointermove',202,340);ptr('pointermove',203,420);ptr('pointerup',203,420);
    await sleep(50);
    check('B5 вертикальный свайп не трогает температуру и не играет ноту',T.temp()===tt&&T.ripples()<=r0,'');

    /* B6. касание: круг и нота (звук вкл.) */
    for(i=0;i<60&&T.ripples()>0;i++)await sleep(100);
    var r1=T.ripples();
    ptr('pointerdown',250,500);ptr('pointerup',250,500);
    await sleep(60);
    check('B6 касание рисует круг',T.ripples()>r1,'кругов '+r1+' → '+T.ripples());

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
