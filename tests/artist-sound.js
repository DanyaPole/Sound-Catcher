'use strict';
/* Звук режима «Художник звука» в реальном Web Audio (headless Chrome). node tests/artist-sound.js */
const {run}=require('./lib');
(async()=>{
  const r=await run('artist-sound',120000);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
