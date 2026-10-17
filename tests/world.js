'use strict';
/* Параллельный мир в реальном Chrome (звук → картина). node tests/world.js
   Сохраняет холст в tests/out/world-playing.png */
const fs=require('fs'),path=require('path'),{run}=require('./lib');
(async()=>{
  const r=await run('world',60000,['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  if(r.png){fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});fs.writeFileSync(path.join(__dirname,'out','world-playing.png'),Buffer.from(r.png.split(',')[1],'base64'));console.log('  холст сохранён: tests/out/world-playing.png')}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
