'use strict';
/* Нарезка ✂️ до и после эффектов и 8 новых эффектов. node tests/slices.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('slices',120000,['--window-size=375,812']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(r.png){const fs=require('fs'),p=require('path').join(__dirname,'out','slices.png');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(r.png.split(',')[1],'base64'));console.log('  картинка нарезки:',p)}
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
