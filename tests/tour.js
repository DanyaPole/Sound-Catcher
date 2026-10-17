'use strict';
/* Обучение для малыша и для взрослого: оба сценария настоящими действиями. node tests/tour.js */
const {run}=require('./lib');
(async()=>{
  let bad=0,total=0;
  const base=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--window-size=500,900'];
  for(const [title,flags] of [['обычный режим',base],['«уменьшить движение»',base.concat(['--force-prefers-reduced-motion'])]]){
    console.log('['+title+']');
    const r=await run('tour',150000,flags);
    (r.results||[]).forEach(x=>{total++;if(!x.ok)bad++;console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:'')});
    if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  }
  console.log('\nИтого: ✓',total-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
