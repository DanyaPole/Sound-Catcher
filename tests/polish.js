'use strict';
/* Этап 5: производительность, число эх, экспорт картины; отдельным запуском — «уменьшить движение». node tests/polish.js */
const fs=require('fs'),path=require('path'),{run}=require('./lib');
(async()=>{
  let bad=0,total=0;
  for(const [title,flags] of [['обычный режим',[]],['«уменьшить движение»',['--force-prefers-reduced-motion']]]){
    console.log('['+title+']');
    const r=await run('polish',120000,flags);
    (r.results||[]).forEach(x=>{total++;if(!x.ok)bad++;console.log(' ',x.ok?'✓':'✗',x.name,x.detail?'— '+x.detail:'')});
    if(r.png){fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});fs.writeFileSync(path.join(__dirname,'out','share-art.png'),Buffer.from(r.png.split(',')[1],'base64'))}
    if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  }
  console.log('\nИтого: ✓',total-bad,' ✗',bad);
  process.exit(bad?1:0);
})();
