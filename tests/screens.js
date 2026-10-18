'use strict';
/* Снимки экрана телефона (390×844) для разбора дизайна: node tests/screens.js → tests/out/screens/*.png */
const path=require('path'),fs=require('fs'),{serve,shot}=require('./lib');
const SCENES=['gate','start','picker','result','fx','busy','tools','lab','world','world-echo','world-curves'];
(async()=>{
  const s=await serve(),dir=path.join(__dirname,'out','screens');fs.mkdirSync(dir,{recursive:true});
  for(const n of SCENES){
    const f=path.join(dir,n+'.png'),ok=await shot('http://127.0.0.1:'+s.port+'/index.html#sa-test&run=scene&s='+n,f,500,830,5000);
    console.log(ok?'  ✓':'  ✗',n,ok?f:'');
  }
  s.server.close();
})();
