'use strict';
/* G1 (вторая часть): остальные визуальные эффекты — искры от касаний и бесконечные CSS-анимации. node tests/flash2.js
   Правило: не больше 3 вспышек в секунду (строже: каждый переход света туда и обратно считается). */
const {run}=require('./lib');
(async()=>{
  const r=await run('flash2',120000,['--window-size=500,900']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok&&r.error){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
