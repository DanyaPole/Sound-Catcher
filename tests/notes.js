'use strict';
/* Ноты: тянуть ноту вверх-вниз — звук правда меняется; ⬆️ ⬇️ ↺ 🎲 мелодия. node tests/notes.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('notes',90000,['--window-size=375,812']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(r.png){const fs=require('fs'),p=require('path').join(__dirname,'out','notes.png');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(r.png.split(',')[1],'base64'));console.log('  картинка нот:',p)}
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
