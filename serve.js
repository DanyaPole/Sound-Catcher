'use strict';
/* Локальный запуск Звуколовки для самостоятельного теста.
   node serve.js [--open] [--port 8080]
   • http://localhost:8080 — на этом компьютере (микрофон работает: localhost считается безопасным адресом)
   • https://<адрес-компьютера>:8443 — для телефона по Wi-Fi (микрофон требует HTTPS; сертификат самоподписанный —
     в браузере телефона нужно один раз нажать «Дополнительно → Всё равно открыть»)
   Отдаются только файлы сайта (страница, значки, манифест): остальные файлы проекта по сети не видны. */
const http=require('http'),https=require('https'),fs=require('fs'),path=require('path'),os=require('os');
const {execFileSync,spawn}=require('child_process');
const ROOT=__dirname,CERTS=path.join(ROOT,'.certs');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:true)};
const PORT=+arg('--port')||8080;

function lanAddrs(){
  const out=[];
  Object.entries(os.networkInterfaces()).forEach(([name,list])=>(list||[]).forEach(a=>{
    if(a.family==='IPv4'&&!a.internal)out.push({name,ip:a.address,home:/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(a.address)});
  }));
  return out.sort((a,b)=>b.home-a.home);
}
function findOpenssl(){
  const list=[process.env.OPENSSL,'openssl','C:\\Program Files\\Git\\usr\\bin\\openssl.exe','C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe','C:\\msys64\\ucrt64\\bin\\openssl.exe','C:\\msys64\\usr\\bin\\openssl.exe'].filter(Boolean);
  for(const c of list){try{execFileSync(c,['version'],{stdio:'ignore'});return c}catch(e){}}
  return null;
}
/* самоподписанный сертификат на адреса этого компьютера; пересоздаётся, если адрес сменился */
function certFor(ips){
  const key=path.join(CERTS,'key.pem'),crt=path.join(CERTS,'cert.pem'),meta=path.join(CERTS,'ips.txt'),want=ips.join(',');
  try{if(fs.readFileSync(meta,'utf8')===want&&fs.existsSync(key)&&fs.existsSync(crt))return {key:fs.readFileSync(key),cert:fs.readFileSync(crt)}}catch(e){}
  const ssl=findOpenssl();if(!ssl)return null;
  fs.mkdirSync(CERTS,{recursive:true});
  const san=['DNS:localhost','IP:127.0.0.1'].concat(ips.map(i=>'IP:'+i)).join(',');
  try{
    execFileSync(ssl,['req','-x509','-newkey','rsa:2048','-nodes','-days','825','-keyout',key,'-out',crt,'-subj','/CN=zvukolovka','-addext','subjectAltName='+san],{stdio:'ignore'});
    fs.writeFileSync(meta,want);
    return {key:fs.readFileSync(key),cert:fs.readFileSync(crt)};
  }catch(e){return null}
}
/* только то, что лежит на сайте: страница, значки и манифест */
const PUBLIC={'/index.html':'text/html; charset=utf-8','/icon.svg':'image/svg+xml','/icon-192.png':'image/png','/icon-512.png':'image/png',
  '/apple-touch-icon.png':'image/png','/manifest.json':'application/manifest+json'};
function handler(req,res){
  let u=req.url.split('?')[0].split('#')[0];
  if(u==='/')u='/index.html';
  if(PUBLIC[u]){
    res.writeHead(200,{'Content-Type':PUBLIC[u],'Cache-Control':'no-store'});
    fs.createReadStream(path.join(ROOT,u.slice(1))).pipe(res);return;
  }
  if(u==='/favicon.ico'){res.writeHead(204);res.end();return}
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Нет такого файла');
}
function listen(server,port,tries,cb){
  server.once('error',e=>{if(e.code==='EADDRINUSE'&&tries>0)listen(server,port+1,tries-1,cb);else{console.error('Не удалось занять порт '+port+': '+e.message);process.exit(1)}});
  server.listen(port,'0.0.0.0',()=>cb(server.address().port));
}
(function main(){
  const lan=lanAddrs(),ips=lan.map(a=>a.ip);
  const hs=http.createServer(handler);
  listen(hs,PORT,10,hp=>{
    const cert=certFor(ips);
    const line='─'.repeat(62);
    console.log('\n'+line+'\n  ЗВУКОЛОВКА — запуск для теста\n'+line);
    console.log('\n  На этом компьютере (с микрофоном):\n    http://localhost:'+hp+'/');
    console.log('    чистое первое знакомство: http://localhost:'+hp+'/?fresh');
    const done=sp=>{
      if(sp){
        console.log('\n  На телефоне (тот же Wi-Fi):');
        lan.forEach(a=>console.log('    https://'+a.ip+':'+sp+'/'+(a.home?'   ← скорее всего этот':'   ('+a.name+')')));
        console.log('\n  Для нового человека добавьте в конец адреса  ?fresh  (покажет обучение заново)');
        console.log('  В телефоне при первом открытии: «Дополнительно» → «Всё равно открыть».');
        console.log('  Если телефон не открывает адрес — разрешите Node.js в брандмауэре Windows (частная сеть).');
      }else{
        console.log('\n  Телефон: HTTPS-адрес не создан (нет openssl). Для микрофона на телефоне нужен HTTPS.');
        console.log('  Установите Git for Windows (в нём есть openssl) или задайте путь в переменной OPENSSL.');
      }
      console.log('\n  Остановить: Ctrl+C или закрыть это окно.\n'+line+'\n');
      if(arg('--open'))spawn('cmd',['/c','start','','http://localhost:'+hp+'/?fresh'],{stdio:'ignore',detached:true}).unref();
    };
    if(!cert)return done(0);
    const ss=https.createServer(cert,handler);
    listen(ss,hp===8080?8443:hp+363,10,done);
  });
})();
