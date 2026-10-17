/* Страничная часть теста этапа 4: холст эха. #sa-test&run=echo
   Рисуем настоящими событиями касания по #ecTop и слушаем результат через настоящий рендер. */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return document.getElementById(id)};
  function pe(type,x,y){
    var r=$('ecTop').getBoundingClientRect();
    $('ecTop').dispatchEvent(new PointerEvent(type,{clientX:r.left+x*r.width,clientY:r.top+y*r.height,bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true}));
  }
  function tap(x,y){pe('pointerdown',x,y);pe('pointerup',x,y)}
  function stroke(x0,y0,x1,y1,n){pe('pointerdown',x0,y0);for(var i=1;i<=n;i++)pe('pointermove',x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);pe('pointerup',x1,y1)}
  function btn(sel){var b=document.querySelector(sel);b.click();return b}
  function energy(d,t0,t1,sr){var s=0,i;for(i=Math.round(t0*sr);i<Math.min(d.length,Math.round(t1*sr));i++)s+=d[i]*d[i];return s}
  function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)}
  try{
    var T=window.__SA.test,sr=44100,n=Math.round(sr*0.3),L=new Float32Array(n),i;
    for(i=0;i<Math.round(sr*0.05);i++){var w=0.5-0.5*Math.cos(2*Math.PI*i/(sr*0.05));L[i]=0.8*w*Math.sin(2*Math.PI*440*i/sr)}
    T.load([L,new Float32Array(L)],sr);T.fx([]);T.out(1,0);
    $('gate').classList.add('hide');
    T.ui();
    var box=$('echoBox');
    check('E0 вне мира холст эха скрыт',getComputedStyle(box).display==='none','');
    var h0=hash(await T.render());
    T.world.set(true);await sleep(300);
    check('E1 в мире холст эха показан',getComputedStyle(box).display!=='none'&&$('ecTop').clientWidth>100,'ширина '+$('ecTop').clientWidth);
    check('E1b по умолчанию режим эха выключен: звук как обычно',!T.ec.on(),'');

    /* рисуем: перо, голубая краска, точка на 0,25 с у горизонта */
    btn('#ecTools [data-tool=clear]');
    check('E2 «очистить»: холст пуст, мера случайности «пусто»',T.ec.snap().total===0&&$('ecEntTxt').textContent==='пусто','');
    btn('#ecTools [data-tool=pen]');btn('#ecPal [data-paint=blue]');
    var p0=T.ec.previews(),tr=T.temp();
    tap(0.25/3,0.5);
    var cv=T.ec.cv(),cell=Math.floor(0.5*cv.h)*cv.w+Math.floor(0.25/3*cv.w);
    check('E3 перо оставляет голубую точку в нужной клетке',cv.d[cell]>0&&cv.p[cell]<-100,'густота '+cv.d[cell]+' панорама '+cv.p[cell]);
    check('E3b касание сразу звучит (предпросмотр)',T.ec.previews()>p0,'');
    check('E3c мера случайности у одной точки — «предсказуемо»',$('ecEntTxt').textContent==='предсказуемо','энтропия '+T.ec.snap().entropy.toFixed(3));

    /* слушаем: первый мазок сам включил «Эхо рисую я» — эхо слева на 0,25 с */
    check('E4 первый мазок сам включает «Эхо рисую я»',T.ec.on()&&$('artistSw').getAttribute('aria-checked')==='true','');
    btn('#artistSw');var swOff=!T.ec.on();btn('#artistSw');
    check('E4b выключатель по-прежнему выключает и включает',swOff&&T.ec.on(),'');
    var A=await T.render(),AL=A.getChannelData(0),AR2=A.getChannelData(1);
    var eL=energy(AL,0.18,0.42,sr),eR=energy(AR2,0.18,0.42,sr),dry=energy(AL,0,0.12,sr);
    check('E5 нарисованное голубым пером слышно: эхо ≈ 0,25 с в левом ухе',eL>0.2*dry&&eR<0.02*eL,'эхо/оригинал='+(eL/dry).toFixed(2)+' R/L='+(eR/eL).toExponential(1));

    /* отмена / возврат */
    btn('#ecTools [data-tool=undo]');
    check('E6 «назад»: мазок убран, эха нет',T.ec.snap().total===0,'');
    btn('#ecTools [data-tool=redo]');
    check('E6b «вперёд»: мазок вернулся',T.ec.snap().total>0,'');

    /* ластик */
    btn('#ecTools [data-tool=clear]');btn('#ecTools [data-tool=brush]');btn('#ecPal [data-paint=amber]');
    stroke(0.3,0.4,0.5,0.4,12);
    var t1=T.ec.snap().total;
    check('E7 кисть оставляет янтарный мазок',t1>0&&Array.prototype.some.call(cv.p,function(v){return v>100}),'сумма '+t1);
    btn('#ecTools [data-tool=erase]');
    stroke(0.28,0.4,0.52,0.4,14);stroke(0.28,0.4,0.52,0.4,14);stroke(0.28,0.4,0.52,0.4,14);
    check('E8 ластик убирает краску',T.ec.snap().total<t1*0.4,'было '+t1+' стало '+T.ec.snap().total);

    /* рисование на холсте не трогает жесты мира */
    check('E9 рисование на холсте не меняет температуру мира',T.temp()===tr,'');

    /* пресет картинкой */
    btn('#ecPre [data-pre=pingpong]');
    var plan=T.ec.plan(),okPP=plan.length>0&&plan.every(function(e){return e.pan===-1||e.pan===1});
    check('E10 пресет «Пинг-понг» по миниатюре: эхо только слева и справа',okPP,'эх в плане '+plan.length);

    /* звук рисует: всплески в момент звучания эха */
    T.ec.log().length=0;
    T.world.play();
    var maxSp=0,t0=performance.now();
    var shot='';
    while(performance.now()-t0<3900){await sleep(30);maxSp=Math.max(maxSp,T.ec.splashes());if(!shot&&T.ec.splashes()>=5)shot=T.ecpng()}
    var lg=T.ec.log(),pl=T.ec.plan(),maxLag=-1,minLag=9;
    lg.forEach(function(e){var l=e.at-e.tap;if(l>maxLag)maxLag=l;if(l<minLag)minLag=l});
    check('E11 всплеск у каждого эха: сколько эх в плане, столько всплесков',lg.length===pl.length&&pl.length>0,'эх '+pl.length+', всплесков '+lg.length);
    check('E11b всплеск совпадает с эхом по времени (запаздывание ≤ 100 мс, не раньше)',minLag>=-0.001&&maxLag<=0.1,'от '+(minLag*1000).toFixed(0)+' до '+(maxLag*1000).toFixed(0)+' мс');
    check('E11c одновременных всплесков не больше 256 и они видны',maxSp>0&&maxSp<=256,'максимум '+maxSp);

    /* ползунки */
    $('ecInfl').value=50;$('ecInfl').dispatchEvent(new Event('input'));$('ecInfl').dispatchEvent(new Event('change'));
    var srcs={};T.ec.plan().forEach(function(e){srcs[e.src]=(srcs[e.src]||0)+1});
    check('E12 сила холста 50 %: часть эх с холста, часть — «туман»',Math.abs(T.ec.plan().length-24)<=24&&srcs.c>0&&srcs.f>0,'с холста '+srcs.c+', туман '+srcs.f);
    $('ecInfl').value=100;$('ecInfl').dispatchEvent(new Event('input'));$('ecInfl').dispatchEvent(new Event('change'));
    $('ecBlur').value=60;$('ecBlur').dispatchEvent(new Event('input'));
    check('E13 размытие: холст показан размытым на ту же величину',/blur\(/.test($('ecPaint').style.filter)&&$('ecBlurTxt').textContent==='60%','фильтр '+$('ecPaint').style.filter);
    $('ecBlur').value=0;$('ecBlur').dispatchEvent(new Event('input'));$('ecBlur').dispatchEvent(new Event('change'));

    /* «ещё раз» бросает эхо заново */
    var before=JSON.stringify(T.ec.plan());btn('#ecTools [data-tool=dice]');
    check('E14 «ещё раз»: картина та же, эхо другие',JSON.stringify(T.ec.plan())!==before,'');

    /* сохранение */
    await sleep(900);
    var sv=null;try{sv=JSON.parse(localStorage.getItem('zv-echo'))}catch(e){}
    check('E15 картина сохраняется в браузере',sv&&sv.v===1&&sv.d.length>100&&sv.a===1,'');

    /* выход из мира: звук как обычно, бит в бит */
    T.world.set(false);await sleep(150);
    var h1=hash(await T.render());
    check('E16 выход из мира: режим не звучит, рендер бит в бит как до входа',!T.ec.on()&&h1===h0,h0+' / '+h1);
    T.world.set(true);await sleep(150);
    check('E17 повторный вход: выключатель помнит «включено»',T.ec.on(),'');
    T.world.set(false);

    await report({ok:true,results:results,png:shot});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
