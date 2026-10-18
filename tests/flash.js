'use strict';
/* Ограничитель вспышек G1: не больше 3 в секунду. node tests/flash.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('flash',120000,['--window-size=375,812']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(r.png){const fs=require('fs'),p=require('path').join(__dirname,'out','flash.png');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(r.png.split(',')[1],'base64'));console.log('  картинка дорожек:',p)}
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
