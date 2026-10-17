/* Для скриншота: входим в мир, показываем интерфейс с записью, запускаем звук и держим страницу.
   Грузится из index.html#sa-test&run=worldshot[&still] */
(async function(){
  /* держим событие load, чтобы скриншот пришёлся на середину звука */
  var hold=new Image();hold.src="/slow?ms="+(/hold=(d+)/.exec(location.hash)||[0,2500])[1];

  var sp=document.getElementById('splash');if(sp)sp.remove();var gt=document.getElementById('gate');if(gt)gt.classList.add('hide');
  var T=window.__SA.test,sr=44100,n=Math.round(sr*4),L=new Float32Array(n),i;
  for(i=0;i<n;i++){var t=i/sr,f=330+420*Math.sin(t*1.6)*Math.sin(t*0.7)+200*(t/4);L[i]=0.5*Math.sin(2*Math.PI*f*t)*(0.55+0.45*Math.sin(2*Math.PI*3*t))}
  T.load([L,new Float32Array(L)],sr);T.fx([['echo',2]]);T.out(1,0);
  T.ui();
  if(location.hash.indexOf('night')<0)T.world.set(true);
  T.world.play();
})();
