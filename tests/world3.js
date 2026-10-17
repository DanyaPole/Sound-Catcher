'use strict';
/* Этап 3: кисти эффектов, жест температуры, картины в галерее. node tests/world3.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('world3',120000,['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
