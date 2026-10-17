/* Контактная карта: один звук, нарисованный кистями разных эффектов. #sa-test&run=sheet */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function loadImg(u){return new Promise(function(r){var i=new Image();i.onload=function(){r(i)};i.src=u})}
  try{
    var T=window.__SA.test,sr=44100,n=Math.round(sr*2.4),L=new Float32Array(n),i;
    for(i=0;i<n;i++){var t=i/sr,f=330+420*Math.sin(t*2.2)*Math.sin(t*0.9)+260*(t/2.4);L[i]=0.55*Math.sin(2*Math.PI*f*t)*(0.55+0.45*Math.sin(2*Math.PI*3*t))}
    T.load([L,new Float32Array(L)],sr);T.out(1,0);
    document.getElementById('gate').classList.add('hide');
    T.ui();T.world.set(true);await sleep(200);
    var set=[['orig',[]],['echo',[['echo',3]]],['cave',[['cave',3]]],['warp',[['warp',3]]],['retro',[['retro',3]]],['rock',[['rock',3]]],['water',[['water',3]]],['chorus',[['chorus',3]]],['parrot',[['parrot',3]]]];
    var W=300,H=220,cols=3,rows=3,sheet=document.createElement('canvas');sheet.width=W*cols;sheet.height=H*rows;
    var g=sheet.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,sheet.width,sheet.height);
    for(i=0;i<set.length;i++){
      T.fx(set[i][1]);T.world.play();await sleep(2250);
      var im=await loadImg(T.world.png());
      var x=(i%cols)*W,y=Math.floor(i/cols)*H;
      g.drawImage(im,0,0,im.width,im.height,x,y,W,H);
      g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x,y,110,22);g.fillStyle='#fff';g.font='700 14px sans-serif';g.fillText(set[i][0],x+8,y+16);
      await sleep(1700);
    }
    await report({ok:true,results:[],png:sheet.toDataURL('image/png')});
  }catch(e){await report({error:String(e&&e.stack||e)})}
})();
