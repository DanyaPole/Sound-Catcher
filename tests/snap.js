'use strict';
/* Скриншоты интерфейса: node tests/snap.js <имя> <хэш> [ширина] [высота] [мс] -> tests/out/<имя>.png */
const {serve,chrome}=require('./lib'),path=require('path'),fs=require('fs');
(async()=>{
  const [name,hash,w,h,ms]=process.argv.slice(2),s=await serve(),file=path.resolve(__dirname,'out',name+'.png');
  fs.mkdirSync(path.dirname(file),{recursive:true});try{fs.unlinkSync(file)}catch(e){}
  const c=chrome('http://127.0.0.1:'+s.port+'/index.html'+hash,['--screenshot='+file,'--window-size='+(w||390)+','+(h||844),(process.env.VT?'--virtual-time-budget='+process.env.VT:'--timeout='+(ms||4500)),'--hide-scrollbars','--force-device-scale-factor=2']);
  await new Promise(r=>c.proc.on('exit',r));c.stop();s.server.close();
  console.log(name,fs.existsSync(file)?'ok':'нет файла');
})();
