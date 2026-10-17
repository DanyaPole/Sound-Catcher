/* Ноты: тянуть ноту вверх-вниз — звук правда меняется; ⬆️ ⬇️ ↺ 🎲. #sa-test&run=notes (фрейм 375×812) */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)+':'+ab.length}
  /* частота по переходам через ноль (вверх), с долями отсчёта */
  function freq(ab,t0,t1){
    var d=ab.getChannelData(0),sr=ab.sampleRate,a=Math.round(t0*sr),b=Math.round(t1*sr),first=-1,last=-1,n=0,i;
    for(i=a;i<b;i++)if(d[i-1]<0&&d[i]>=0){var x=i-1+(-d[i-1])/(d[i]-d[i-1]);if(first<0)first=x;else n++;last=x}
    return n?n/((last-first)/sr):0;
  }
  function near(f,want,tol){return Math.abs(f/want-1)<(tol||0.015)}
  var NOTES=[[440,0,0.4],[523.25,0.45,0.85],[659.25,0.9,1.3]];
  function ptr(type,el,x,y){el.dispatchEvent(new W.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:3,pointerType:'touch',isPrimary:true}))}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,N=T.notes,P=T.player,sr=44100,len=Math.round(sr*1.4),L=new Float32Array(len),i;
    NOTES.forEach(function(q){var a=Math.round(q[1]*sr),b=Math.round(q[2]*sr),F=Math.round(sr*0.01);for(i=a;i<b;i++){var e=Math.min(1,(i-a)/F,(b-i)/F);L[i]=0.6*e*Math.sin(2*Math.PI*q[0]*(i-a)/sr)}});
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;
    T.load([L],sr);T.ui();N.tab();await sleep(300);

    var runs=N.runs();
    check('N1 найдены три ноты: Ля, До, Ми',runs.length===3&&runs[0].m===69&&runs[1].m===72&&runs[2].m===76,JSON.stringify(runs.map(function(r){return r.m})));
    var orig=await T.render(),h0=hash(orig);
    check('N2 без правок звук не тронут',near(freq(orig,0.1,0.3),440,0.005),freq(orig,0.1,0.3).toFixed(1)+' Гц');

    /* тянем первую ноту на 2 полутона вверх */
    var cv=$('roll');cv.scrollIntoView({block:'center'});await sleep(150);
    T.notes.tab();await sleep(100);
    var rg=N.range(),r=cv.getBoundingClientRect(),q=runs[0];
    var x=r.left+((q.s+q.e+1)/2)/rg.n*r.width,y=r.top+r.height-4-(N.shown(0)-rg.lo+0.5)*rg.rh;
    ptr('pointerdown',cv,x,y);ptr('pointermove',cv,x,y-rg.rh);ptr('pointermove',cv,x,y-2*rg.rh-1);ptr('pointerup',cv,x,y-2*rg.rh-1);await sleep(150);
    check('N3 потянул Ля на 2 ступеньки вверх — правка +2',N.edits()[0]===2&&Object.keys(N.edits()).length===1,JSON.stringify(N.edits())+' · '+$('msg').textContent);
    var s=P.state();
    check('N4 после правки играет с этой ноты',s.on&&s.ps.length&&Math.abs(s.ps[0].a-runs[0].s/rg.n)<0.03,s.ps.length?s.ps[0].a.toFixed(3):'—');
    P.stop();
    var ed=await T.render(),f0=freq(ed,0.1,0.3),f1=freq(ed,0.55,0.75),f2=freq(ed,1.0,1.2);
    check('N5 первая нота правда стала Си (493,9 Гц)',near(f0,493.88),f0.toFixed(1)+' Гц');
    check('N6 остальные ноты не тронуты',near(f1,523.25,0.005)&&near(f2,659.25,0.005),f1.toFixed(1)+' / '+f2.toFixed(1)+' Гц');
    check('N7 длина звука та же',ed.length===orig.length,ed.length+' = '+orig.length);
    check('N8 на экране нота стоит выше',N.shown(0)===71,'midi '+N.shown(0));
    var shot=$('pNotes').getBoundingClientRect();window.__notesPng=cv.toDataURL('image/png');

    /* касание ноты без движения — играть с неё */
    var q2=runs[2],x2=r.left+((q2.s+q2.e+1)/2)/rg.n*r.width;N.range();
    var y2=r.top+r.height-4-(N.shown(2)-N.range().lo+0.5)*N.range().rh;
    ptr('pointerdown',cv,x2,y2);ptr('pointerup',cv,x2,y2);await sleep(120);
    var s2=P.state();
    check('N9 касание ноты — играть с неё, без правки',s2.on&&Math.abs(s2.ps[0].a-q2.s/rg.n)<0.03&&!N.edits()[2],s2.ps.length?s2.ps[0].a.toFixed(3):'—');
    P.stop();

    $('nUp').click();await sleep(100);P.stop();
    var up=await T.render();
    check('N10 ⬆️ — все ноты на полтона выше',near(freq(up,0.1,0.3),523.25)&&near(freq(up,0.55,0.75),554.37)&&near(freq(up,1.0,1.2),698.46),[freq(up,0.1,0.3),freq(up,0.55,0.75),freq(up,1.0,1.2)].map(function(v){return v.toFixed(1)}).join(' / '));
    $('nReset').click();await sleep(100);P.stop();
    var back=await T.render();
    check('N11 ↺ — звук снова бит в бит как был',hash(back)===h0,hash(back)+' / '+h0);

    var keys={};for(i=0;i<6;i++){N.dice(null,true);keys[JSON.stringify(N.edits())]=1}
    var CMAJ=[0,2,4,5,7,9,11],inKey=[0,1,2].every(function(k){return CMAJ.indexOf(((N.shown(k)%12)+12)%12)>=0});
    check('N12 🎲 мелодия: разные, и все ноты в тональности',Object.keys(keys).length>=3&&inKey,Object.keys(keys).length+' вариантов, последние ноты '+[0,1,2].map(N.shown).join(','));
    $('nReset').click();await sleep(50);P.stop();

    T.fx([['low',3]]);
    check('N13 Слон: ноты на экране ниже (на 9 полутонов)',N.shown(0)===60,'midi '+N.shown(0));
    T.fx([]);

    N.set(1,-3);var k1=N.key();
    T.load([L],sr);
    check('N14 новый звук — правки сброшены',N.key()===''&&k1!=='',k1+' → «'+N.key()+'»');

    /* мир: ноты тоже тянутся, звук из мира — тот же граф */
    T.world.set(true);await sleep(300);$('tourPick').hidden=true;
    N.tab();await sleep(150);N.runs();N.set(0,5);
    var wr=await T.render();
    check('N15 в мире правка тоже слышна (Ре, 587 Гц)',near(freq(wr,0.1,0.3),587.33),freq(wr,0.1,0.3).toFixed(1)+' Гц');
    T.world.set(false);

    await report({ok:true,results:results,png:window.__notesPng});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
