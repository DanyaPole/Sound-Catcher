/* Для скриншота холста эха. #sa-test&run=echoshot */
(function(){
  var $=function(id){return document.getElementById(id)};
  var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');
  var T=window.__SA.test,sr=44100,n=Math.round(sr*2),L=new Float32Array(n),i;
  for(i=0;i<n;i++){var t=i/sr;L[i]=0.5*Math.sin(2*Math.PI*(330+200*t)*t)*Math.exp(-3*(t%0.5))}
  T.load([L,new Float32Array(L)],sr);T.fx([]);T.out(1,0);T.ui();T.world.set(true);
  document.querySelector('#ecPre [data-pre=mirror]').click();
  document.querySelector('#ecPal [data-paint=amber]').click();
  if(!window.__SA.test.ec.on())document.querySelector('#artistSw').click();
  $('echoBox').scrollIntoView();
})();
