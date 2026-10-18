/* Дорожки времени в мире: громкость, высота, ухо, яркость, волшебство. #sa-test&run=curves (фрейм 375×812) */
(async function(){
  var W=window,D=document;
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  var results=[];
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  var $=function(id){return D.getElementById(id)};
  function hash(ab){var h=2166136261>>>0,c,k;for(c=0;c<ab.numberOfChannels;c++){var d=ab.getChannelData(c),u=new Uint32Array(d.buffer,d.byteOffset,d.length);for(k=0;k<u.length;k++)h=Math.imul(h^u[k],16777619)>>>0}return h.toString(16)+':'+ab.length}
  /* частота основного тона: сигнал сглажен (13 отсчётов), чтобы тихий высокий обертон не давал лишних переходов через ноль */
  function freq(ab,t0,t1,ch){
    var x=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.max(14,Math.round(t0*sr)),b=Math.min(x.length,Math.round(t1*sr)),first=-1,last=-1,n=0,i,j,d=new Float32Array(x.length);
    for(i=a-14;i<b;i++){var s=0;for(j=0;j<13;j++)s+=x[i-j];d[i]=s}
    for(i=a;i<b;i++)if(d[i-1]<0&&d[i]>=0){var x=i-1+(-d[i-1])/(d[i]-d[i-1]);if(first<0)first=x;else n++;last=x}
    return n?n/((last-first)/sr):0;
  }
  function gz(ab,t0,t1,f,ch){
    var d=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.round(t0*sr),b=Math.min(d.length,Math.round(t1*sr)),w=2*Math.cos(2*Math.PI*f/sr),s1=0,s2=0,i;
    for(i=a;i<b;i++){var s=d[i]+w*s1-s2;s2=s1;s1=s}
    return Math.sqrt(Math.max(0,s1*s1+s2*s2-w*s1*s2))*2/(b-a);
  }
  function rms(ab,t0,t1,ch){var d=ab.getChannelData(ch||0),sr=ab.sampleRate,a=Math.round(t0*sr),b=Math.min(d.length,Math.round(t1*sr)),e=0,i;for(i=a;i<b;i++)e+=d[i]*d[i];return Math.sqrt(e/Math.max(1,b-a))}
  function near(f,want,tol){return Math.abs(f/want-1)<(tol||0.015)}
  function f2(v){return v.toFixed(2)}
  function ptr(type,el,x,y){el.dispatchEvent(new W.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:6,pointerType:'touch',isPrimary:true}))}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}');localStorage.removeItem('zv-curves')}catch(e){}
    var fr=D.createElement('iframe');
    fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';fr.src='/index.html#sa-test';
    D.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(300);
    W=fr.contentWindow;D=fr.contentDocument;
    var T=W.__SA.test,C=T.curves,P=T.player,sr=44100,i;
    var sp=$('splash');if(sp)sp.remove();$('gate').classList.add('hide');$('tourPick').hidden=true;

    /* Ля 440 Гц + тихий обертон 3520 Гц, 1,2 с */
    var len=Math.round(sr*1.2),A=new Float32Array(len);
    for(i=0;i<len;i++){var e=Math.min(1,i/441,(len-1-i)/441);A[i]=e*(0.4*Math.sin(2*Math.PI*440*i/sr)+0.08*Math.sin(2*Math.PI*3520*i/sr))}
    T.load([A],sr);T.ui();T.fx([]);T.out(1,0);await sleep(100);
    var plain=await T.render(),h0=hash(plain);

    /* вне мира дорожки не слышны */
    C.init();C.set('pitch',1);
    var outW=await T.render();
    check('C1 вне мира звук не тронут (бит в бит)',hash(outW)===h0&&!C.on(),hash(outW));

    T.world.set(true);await sleep(300);$('tourPick').hidden=true;
    var box=$('crvBox'),bx=box.getBoundingClientRect();
    check('C2 в мире блок «Рисую звук во времени»: 5 дорожек, 6 форм, 🎲 и ↺',bx.height>200&&D.querySelectorAll('#crvLanes button').length===5&&D.querySelectorAll('#crvShapes button').length===8,Math.round(bx.height)+' px');

    var up=await T.render();
    check('C3 высота +12 по всей длине: Ля стала 880 Гц, звук вдвое короче',near(freq(up,0.1,0.5),880)&&Math.abs(C.factor()-0.5)<0.001&&up.length<plain.length*0.5+sr*0.31,f2(freq(up,0.1,0.5))+' Гц · ×'+C.factor().toFixed(3)+' · '+(up.length/sr).toFixed(2)+' с');

    /* ступеньки: 0, +4, +7, +12 по четвертям времени звучания */
    C.set('pitch',function(x){var k=Math.min(3,Math.floor(x*4));return 0.5+[0,4,7,12][k]/24});
    var st=await T.render(),Tl=1.2*C.factor(),want=[0,4,7,12].map(function(s){return 440*Math.pow(2,s/12)}),got=[0,1,2,3].map(function(k){return freq(st,(k+0.3)/4*Tl,(k+0.7)/4*Tl)});
    check('C4 ступеньки высоты: До-Ми-Соль-До — аккорд по времени',got.every(function(g,k){return near(g,want[k],0.02)}),got.map(function(v){return v.toFixed(0)}).join(' · '));
    C.set('pitch',null);

    C.set('vol',function(x){return 0.05+0.9*x});
    var vr=await T.render(),rv=[0,1,2,3].map(function(k){return rms(vr,0.1+k*0.25,0.25+k*0.25)});
    check('C5 громкость «растёт»: звук нарастает',rv[0]<rv[1]&&rv[1]<rv[2]&&rv[2]<rv[3]&&rv[0]<rv[3]*0.35,rv.map(f2).join(' < '));
    C.set('vol',null);

    C.set('pan',0);
    var pl=await T.render();
    check('C6 ухо: вся линия внизу — звук только в левом',pl.numberOfChannels===2&&rms(pl,0.2,1,1)<0.01&&rms(pl,0.2,1,0)>0.1,'Л '+f2(rms(pl,0.2,1,0))+' П '+rms(pl,0.2,1,1).toFixed(3));
    C.set('pan',function(x){return 0.5+0.5*Math.sin(2*Math.PI*2*x)});
    var pw=await T.render(),dl=[0,1,2,3,4,5,6,7].map(function(k){var t=0.05+k*0.14;return rms(pw,t,t+0.05,1)-rms(pw,t,t+0.05,0)});
    check('C7 ухо «волны»: звук ходит из уха в ухо',Math.max.apply(null,dl)>0.1&&Math.min.apply(null,dl)<-0.1,dl.map(f2).join(' '));
    C.set('pan',null);

    C.set('bright',1);var br=await T.render();C.set('bright',0);var dk=await T.render();C.set('bright',null);
    var hp=gz(plain,0.2,1,3520),hb=gz(br,0.2,1,3520),hd=gz(dk,0.2,1,3520);
    check('C8 яркость: вверху звонче, внизу глуше',hb>hp*3&&hd<hp*0.3,'обертон: '+hd.toFixed(4)+' < '+hp.toFixed(4)+' < '+hb.toFixed(4));

    /* волшебство: колокол сначала весь, к концу пропадает */
    T.fx([['ring',3]]);
    C.set('wet',function(x){return 1-x});
    var wr=await T.render(),side=440+560,s1=gz(wr,0.05,0.25,side),s2=gz(wr,1.05,1.18,side),o1=gz(wr,1.05,1.18,440);
    check('C9 волшебство «затихает»: эффект в начале есть, в конце звук как был',s1>0.05&&s2<s1*0.15&&o1>0.1,'колокол '+s1.toFixed(3)+' → '+s2.toFixed(3)+', Ля в конце '+o1.toFixed(3));
    C.set('wet',null);T.fx([]);

    var back=await T.render();
    check('C10 все линии ровные — в мире звук бит в бит как был',hash(back)===h0&&!C.on(),hash(back));

    /* пальцем: дорожка «высота», горка */
    var cv=$('crv');cv.scrollIntoView({block:'center'});await sleep(150);
    C.lane('pitch',true);var r=cv.getBoundingClientRect(),s0=C.strokes();
    ptr('pointerdown',cv,r.left+4,r.top+r.height/2);
    for(i=1;i<=12;i++)ptr('pointermove',cv,r.left+4+(r.width-8)*i/12,r.top+r.height/2-(r.height/2-12)*Math.sin(Math.PI*i/12));
    ptr('pointerup',cv,r.right-4,r.top+r.height/2);await sleep(150);
    var g=C.get('pitch'),mid=g[48];
    check('C11 провёл горку пальцем: середина высоко, края на месте, звук играет',mid>0.9&&Math.abs(g[0]-0.5)<0.05&&Math.abs(g[95]-0.5)<0.06&&C.strokes()===s0+1&&P.state().on,'середина '+f2(mid)+', края '+f2(g[0])+'/'+f2(g[95])+' · '+$('msg').textContent);
    var ps=P.state();
    check('C12 проход длится столько, сколько звук реально звучит (выше — короче)',ps.ps.length&&Math.abs(ps.ps[0].dur-1.2*C.factor())<0.01&&C.factor()<0.9,ps.ps.length?ps.ps[0].dur.toFixed(3)+' с, ×'+C.factor().toFixed(3):'—');
    W.__crvPng=C.png();
    P.stop();
    check('C13 у дорожки «высота» метка «нарисовано»',D.querySelector('#crvLanes [data-lane=pitch]').classList.contains('has')&&!D.querySelector('#crvLanes [data-lane=vol]').classList.contains('has'),'');

    D.querySelector('#crvLanes [data-lane=vol]').click();await sleep(30);
    D.querySelector('#crvShapes [data-shape=wave]').click();await sleep(50);P.stop();
    var vw=C.get('vol');
    check('C14 дорожка «громко» + форма «волны»',D.querySelector('#crvLanes [data-lane=vol]').classList.contains('on')&&Math.max.apply(null,vw)>0.85&&Math.min.apply(null,vw)<0.15,'');
    $('crvReset').click();await sleep(30);P.stop();
    check('C15 ↺ — громкость снова ровная, высота осталась',C.get('vol').every(function(v){return v===0.5})&&C.on(),'');

    C.lane('pitch',true);var okScale=true,vars={};
    for(var k=0;k<6;k++){$('crvDice').click();await sleep(20);P.stop();var pv=C.get('pitch');vars[pv.join(',')]=1;pv.forEach(function(v){var s=(v-0.5)*24;if(Math.abs(s-Math.round(s))>1e-3||[-5,-3,0,2,4,7,9,12].indexOf(Math.round(s))<0)okScale=false})}
    check('C16 🎲 высоты — мелодия из ступеней пентатоники, каждый раз новая',okScale&&Object.keys(vars).length>=4,Object.keys(vars).length+' разных');

    var cnt={};for(k=0;k<20;k++){C.all(Math.random,true).forEach(function(id){cnt[id]=(cnt[id]||0)+1})}
    var nOn=['vol','pitch','pan','bright','wet'].filter(function(id){return C.get(id).some(function(v,ix,a){return Math.abs(v-(id==='wet'?1:0.5))>0.01})}).length;
    check('C17 «🎲 Всё случайно во времени»: 2–3 дорожки, все пять встречаются',Object.keys(cnt).length===5&&nOn>=2&&nOn<=3,JSON.stringify(cnt)+' · сейчас '+nOn);
    $('crvAll').click();await sleep(50);P.stop();
    check('C18 кнопка 🎲 Всё случайно — дорожки нарисованы и звучат',C.on()&&/Во времени/.test($('msg').textContent),$('msg').textContent);

    var seen=0;for(k=0;k<30;k++){P.surprise();P.stop();if(C.on())seen++}
    check('C19 🎲 Сюрприз в мире иногда рисует дорожки, иногда нет',seen>=6&&seen<=24,seen+' из 30');

    C.reset();await sleep(800);
    var saved=null;try{saved=JSON.parse(W.localStorage.getItem('zv-curves'))}catch(e){}
    check('C20 дорожки сохраняются',!!saved&&saved.v===1&&saved.pitch.length===96,'');

    /* вместе с нарезкой после эффектов */
    /* Сюрприз выше включал эффекты, эхо, сухо–мокро — убираем */
    T.fx([]);P.mix(1);T.out(1,0);if(T.ec.on())$('artistSw').click();P.stop();T.load([A],sr);
    C.set('pitch',1);T.slices.set({n:4,mode:'post',order:[3,2,1,0],rev:[false,false,false,false]});
    var pb=await T.slices.post(),rr=await T.render();
    /* 0,9 с звука = 4 кусочка по 0,225 с; третий на выходе — второй кусочек звука, там играет Ля октавой выше */
    check('C21 дорожки и нарезка «после эффектов» дружат',near(freq(rr,0.48,0.64),880,0.02)&&Math.abs(pb.length/sr-0.9)<0.01,f2(freq(rr,0.48,0.64))+' Гц · '+(pb.length/sr).toFixed(2)+' с');
    T.slices.set({order:[0,1,2,3],mode:'pre'});C.reset();
    T.world.set(false);

    await report({ok:true,results:results,png:W.__crvPng});
  }catch(e){await report({error:String(e&&e.stack||e),results:results})}
})();
