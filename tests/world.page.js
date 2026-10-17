/* Страничная часть теста мира: грузится из index.html#sa-test&run=world.
   Проверяет: звук реально рисует картину, развёртка идёт со скоростью звука, выход из мира возвращает всё. */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    var T=window.__SA.test,sr=44100,n=Math.round(sr*3),L=new Float32Array(n),i;
    for(i=0;i<n;i++){var t=i/sr,f=300+500*(t/3);L[i]=0.5*Math.sin(2*Math.PI*f*t)*(0.6+0.4*Math.sin(2*Math.PI*2*t))}
    T.load([L,new Float32Array(L)],sr);T.fx([]);T.out(1,0);

    check('W0 до входа мир выключен',!document.body.classList.contains('world')&&!T.world.on(),'');
    T.world.set(true);
    await sleep(200);
    check('W1 вход: у body класс world',document.body.classList.contains('world')&&T.world.on(),'');
    check('W2 мир нарисован (холст не пуст)',T.world.png().length>2000,'png ~'+T.world.png().length+' байт');
    var s0=T.world.stats();
    check('W3 в тишине ничего не нарисовано',s0.painted===0,'закрашено '+s0.painted);

    T.world.play();
    await sleep(900);
    var s1=T.world.stats();
    await sleep(1200);
    var s2=T.world.stats();
    check('W4 звук рисует: закрашенных клеток стало больше',s1.painted>0&&s2.painted>s1.painted,'0,9 с: '+s1.painted+' → 2,1 с: '+s2.painted+' из '+s2.total);
    check('W5 развёртка идёт слева направо со скоростью звука',s2.x>s1.x&&s2.x>0.5&&s2.x<0.95,'x: '+(s1.x||0).toFixed(2)+' → '+(s2.x||0).toFixed(2)+' (ожидали ≈0,30 → ≈0,70 за 3 с)');
    check('W6 уровень реагирует на звук',s2.lvl>0.02,'lvl='+s2.lvl.toFixed(3));
    var png=T.world.png();
    await sleep(1600);
    var s3=T.world.stats();
    check('W7 после конца звука картина остаётся',s3.painted>=s2.painted*0.8,'закрашено '+s3.painted);

    T.world.set(false);
    await sleep(100);
    check('W8 выход: класс world снят',!document.body.classList.contains('world')&&!T.world.on(),'');
    /* W9. запись с (поддельного) микрофона: голос рисует прямо во время записи */
    T.world.set(true);await sleep(150);
    document.getElementById('gate').classList.add('hide');
    document.getElementById('rec').click();
    await sleep(2200);
    var sr1=T.world.stats();
    check('W9 запись: голос рисует (источник rec, картина закрашивается)',sr1.src==='rec'&&sr1.painted>0,'src='+sr1.src+' закрашено '+sr1.painted+' x='+(sr1.x||0).toFixed(2));
    document.getElementById('rec').click();
    await sleep(800);
    check('W10 после записи кнопка вернулась (state idle) и звук загружен',!document.body.classList.contains('recording')&&document.getElementById('fx').classList.contains('show'),'');
    T.world.set(false);
    await report({ok:true,results:results,png:png});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
