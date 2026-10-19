'use strict';
/* Запуск страницы в headless Chrome без отладочного порта (он закрыт политикой системы).
   Страница сама шлёт результат POST /report на локальный сервер. */
const {spawn}=require('child_process'),http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};

function serve(){
  let onReport=null;const got=new Promise(r=>onReport=r);
  return new Promise(res=>{
    const s=http.createServer((q,r)=>{
      if(q.method==='POST'&&q.url==='/report'){
        let b='';q.on('data',d=>b+=d);q.on('end',()=>{r.writeHead(200,{'Access-Control-Allow-Origin':'*'});r.end('ok');try{onReport(JSON.parse(b))}catch(e){onReport({error:'bad json: '+b.slice(0,200)})}});
        return;
      }
      if(q.url.indexOf('/slow')===0){const ms=+(/ms=(d+)/.exec(q.url)||[0,0])[1];setTimeout(()=>{r.writeHead(200,{'Content-Type':'image/gif'});r.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'))},ms);return}
      const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0].split('#')[0]));
      if(!p.startsWith(ROOT)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);r.end();return}
      r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});
      fs.createReadStream(p).pipe(r);
    }).listen(0,'127.0.0.1',()=>res({server:s,port:s.address().port,report:got}));
  });
}
/* тесты запускают Chrome без звука из колонок (--mute-audio): Web Audio работает, часы идут, слышно только если задать ZV_SOUND=1 */
function chrome(url,extra){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sa-chrome-'));
  const p=spawn(CHROME,['--headless=new','--user-data-dir='+dir,'--no-first-run','--no-default-browser-check','--disable-gpu',
    '--autoplay-policy=no-user-gesture-required'].concat(process.env.ZV_SOUND?[]:['--mute-audio'],extra||[],[url]),{stdio:'ignore'});
  return {proc:p,stop(){try{p.kill()}catch(e){}setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}},800)}};
}
/* открыть страницу ?run=<имя>, дождаться отчёта (до timeout мс) */
async function run(name,timeout,flags){
  const s=await serve(),c=chrome('http://127.0.0.1:'+s.port+'/index.html#sa-test&run='+name,flags);
  let tm;const t=new Promise(r=>{tm=setTimeout(()=>r({error:'таймаут '+(timeout||120000)+' мс'}),timeout||120000)});
  try{return await Promise.race([s.report,t])}finally{clearTimeout(tm);c.stop();s.server.close()}
}
/* скриншот страницы флагом --screenshot */
function shot(url,file,w,h,budget){
  return new Promise(res=>{
    const c=chrome(url,['--screenshot='+file,'--window-size='+(w||390)+','+(h||844),'--virtual-time-budget='+(budget||6000),'--hide-scrollbars']);
    c.proc.on('exit',()=>{c.stop();res(fs.existsSync(file))});
  });
}
module.exports={serve,chrome,run,shot,ROOT};
