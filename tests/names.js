'use strict';
/* Z4a: названия эффектов — подсказка (мышь, долгое нажатие), подписи под плитками, ⚙️, aria. node tests/names.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('names',120000,['--window-size=375,812']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok&&r.error){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
