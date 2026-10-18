'use strict';
/* Z5: если приложение упало при запуске — экран с сообщением вместо белого; при нормальной работе его нет. node tests/errscreen.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('errscreen',90000,['--window-size=500,900']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok&&r.error){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
