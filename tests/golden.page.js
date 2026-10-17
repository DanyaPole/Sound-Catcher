/* Страничная часть золотого теста: грузится из index.html#sa-test&run=golden */
(async function(){
  function report(o){return fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  try{
    var T=window.__SA.test;
    var IDS=['echo','cave','warp','low','high','rev','robot','trem','ufo','radio','water','rock','chorus','retro','parrot'];
    var CASES=[['orig',[],1,0]];
    IDS.forEach(function(id){[1,2,3].forEach(function(l){CASES.push([id+l,[[id,l]],1,0])})});
    CASES.push(['mixA',[['echo',3],['cave',2],['radio',1]],1,0]);
    CASES.push(['mixB',[['rev',2],['chorus',3],['water',1]],1,0]);
    CASES.push(['mixC',[['low',3],['warp',2]],1,0]);
    CASES.push(['tone',[['echo',2]],1.3,0.5]);
    CASES.push(['cold',[],0.8,-0.7]);
    function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
    var sr=44100,n=Math.round(sr*1.5),r=rng(7),L=new Float32Array(n),R=new Float32Array(n),i;
    for(i=0;i<n;i++){var t=i/sr,env=Math.exp(-3*(t%0.5))*0.6;
      L[i]=env*Math.sin(2*Math.PI*(220+180*t)*t)+0.05*(r()*2-1);
      R[i]=env*Math.sin(2*Math.PI*(330+90*t)*t)+0.05*(r()*2-1)}
    T.load([L,R],sr);
    function rms(ab){var s=0,n=0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c);for(k=0;k<d.length;k++){s+=d[k]*d[k];n++}}return Math.sqrt(s/n)}
    function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)+':'+ab.length}
    var out={};
    for(var j=0;j<CASES.length;j++){var c=CASES[j];T.fx(c[1]);T.out(c[2],c[3]);var a=await T.render(),b=await T.render(),h=hash(a);out[c[0]]={h:h,rms:rms(a),stable:h===hash(b)&&!c[1].some(function(f){return f[0]==='chorus'})}}
    await report({ok:true,hashes:out});
  }catch(e){await report({error:String(e&&e.stack||e)})}
})();
