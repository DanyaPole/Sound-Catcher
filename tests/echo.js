'use strict';
/* Этап 4: холст эха — рисуем, слушаем, смотрим всплески. node tests/echo.js */
const fs=require('fs'),path=require('path'),{run}=require('./lib');
(async()=>{
  const r=await run('echo',120000);
  (r.results||[]).forEach(x=>console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:''));
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  if(r.png){fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});fs.writeFileSync(path.join(__dirname,'out','echo-canvas.png'),Buffer.from(r.png.split(',')[1],'base64'));console.log('  холст эха сохранён: tests/out/echo-canvas.png')}
  const bad=r.results.filter(x=>!x.ok).length;
  console.log('\nИтого: ✓',r.results.length-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
