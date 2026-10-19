'use strict';
/* «Чистый звук» и правки нот: сбрасываются ли правки? Только проверка, ничего не чинит. node tests/cleannotes.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('cleannotes',120000,['--window-size=500,900']);
  (r.info||[]).forEach(x=>console.log('  ·',x));
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok&&r.error){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
