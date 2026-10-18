/* Сцены для снимков экрана (node tests/screens.js). #sa-test&run=scene&s=<имя>
   Окно headless не бывает уже ~500 px, поэтому сцена открывается во фрейме 375×812 — ширина телефона */
(function(){
  var m=/[&#]s=([\w-]+)/.exec(location.hash),s=m?m[1]:'start';
  try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
  if(window===window.top){
    document.body.innerHTML='';document.body.style.cssText='margin:0;background:#222';
    var fr=document.createElement('iframe');fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';
    fr.src='/index.html#sa-test&run=scene&s='+s;document.body.appendChild(fr);return;
  }
  var T=window.__SA.test,$=function(id){return document.getElementById(id)};
  var sp=$('splash');if(sp)sp.remove();
  if(s==='gate')return;
  $('gate').classList.add('hide');$('tourPick').hidden=true;
  if(s==='start')return;
  if(s==='picker'){$('demoBtn').click();return}
  T.tour.demo();setTimeout(function(){T.player.stop()},50);
  function at(sel,dy){var e=document.querySelector(sel);if(e)window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-(dy||0))}
  setTimeout(function(){
    if(s==='result')window.scrollTo(0,0);
    if(s==='fx'){document.querySelector('#grid .t[data-id=echo]').click();document.querySelector('#grid .t[data-id=low]').click();T.player.stop();at('#fxDice',150)}
    if(s==='busy'){T.player.surprise();T.player.stop();at('#slBox',150)}
    if(s==='tools'){at('.tools',150)}
    if(s==='lab'){at('.lab',150)}
    if(s==='world'||s==='world-echo'||s==='world-curves'){
      T.world.set(true);$('tourPick').hidden=true;
      if(s==='world-echo')setTimeout(function(){at('#echoBox',150)},200);
      if(s==='world-curves')setTimeout(function(){T.curves.init();T.curves.all(Math.random,true);at('#crvBox',150)},200);
    }
  },300);
})();
