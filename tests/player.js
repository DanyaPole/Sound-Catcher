'use strict';
/* Плеер: прилипает к верху, повтор (один раз / по кругу / туда-сюда / по-новому), кусочек, касание волны, сухо — мокро, 🎲. node tests/player.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('player',90000,['--window-size=375,812']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
