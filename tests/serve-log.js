'use strict';
/* Z5: serve.js пишет строку на каждый запрос (время, http/https, метод, путь, код) и не пишет адреса клиентов;
   по-прежнему отдаёт только страницу, значки и манифест. node tests/serve-log.js */
const {spawn}=require('child_process'),http=require('http'),https=require('https'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PORT=18080;
const results=[];const check=(n,ok,d)=>{results.push({n,ok:!!ok,d:d||''});console.log(' ',ok?'✓':'✗',n,d?'— '+d:'')};
const get=(mod,url)=>new Promise(res=>{const r=mod.get(url,{rejectUnauthorized:false,agent:false},q=>{q.resume();q.on('end',()=>res(q.statusCode))});r.on('error',()=>res(0))});
(async()=>{
  const child=spawn(process.execPath,['serve.js','--port',String(PORT)],{cwd:ROOT,stdio:['ignore','pipe','pipe']});
  let out='';child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>out+=d);
  const t0=Date.now();while(!/Остановить/.test(out)&&Date.now()-t0<15000)await new Promise(r=>setTimeout(r,100));
  const started=out.length,hasHttps=new RegExp('https://[^/\\s]+:'+(PORT+363)+'/').test(out);
  const codes=[await get(http,'http://127.0.0.1:'+PORT+'/'),await get(http,'http://127.0.0.1:'+PORT+'/nope?x=1'),await get(http,'http://127.0.0.1:'+PORT+'/icon.svg'),
    await get(http,'http://127.0.0.1:'+PORT+'/.git/config'),await get(http,'http://127.0.0.1:'+PORT+'/tests/golden.js')];
  let sc=0;if(hasHttps)sc=await get(https,'https://127.0.0.1:'+(PORT+363)+'/');
  await new Promise(r=>setTimeout(r,300));
  const log=out.slice(started).split('\n').filter(l=>/→/.test(l));
  child.kill();
  check('ответы: страница 200, неизвестный путь 404, значок 200',codes[0]===200&&codes[1]===404&&codes[2]===200,codes.join(','));
  check('.git и tests по сети не отдаются (404)',codes[3]===404&&codes[4]===404,codes[3]+','+codes[4]);
  check('на каждый запрос одна строка лога',log.length===5+(hasHttps?1:0),log.length+' строк');
  check('в строке: время, протокол, метод, путь, код',/^\s*\d\d:\d\d:\d\d\s+http\s+GET \/ → 200$/.test(log[0]||'')&&/GET \/nope → 404$/.test(log[1]||'')&&/GET \/icon\.svg → 200$/.test(log[2]||''),(log[0]||'').trim());
  check('строка про .git: 404 и путь виден',/GET \/\.git\/config → 404$/.test(log[3]||''));
  if(hasHttps)check('https помечен как https',/\s+https\s+GET \/ → 200$/.test(log[5]||''),(log[5]||'').trim());
  else console.log('  (openssl не найден — https-часть пропущена)');
  check('адресов клиентов в логе нет (ни IPv4, ни ::1)',!log.some(l=>/\d+\.\d+\.\d+\.\d+|::1|ffff/.test(l)));
  const bad=results.filter(x=>!x.ok).length;console.log('\nИтого: ✓',results.length-bad,' ✗',bad);process.exit(bad?1:0);
})();
