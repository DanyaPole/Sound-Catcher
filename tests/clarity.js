'use strict';
/* Понятность: что звучит, отмена, сравнение, рисование, демо, запись, чистый звук. node tests/clarity.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('clarity',120000,['--window-size=375,812','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(r.png){const fs=require('fs'),p=require('path').join(__dirname,'out','clarity.png');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(r.png.split(',')[1],'base64'));console.log('  снимок плеера:',p)}
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
