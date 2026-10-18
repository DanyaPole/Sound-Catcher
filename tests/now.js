'use strict';
/* Z4c: строка «Звучит: N ▾» — одна строка, ничего не обрезано, список плашек, Esc/вне/повтор, фокус. 320, 375, 412 px. node tests/now.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('now',240000,['--window-size=500,900']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok&&r.error){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
