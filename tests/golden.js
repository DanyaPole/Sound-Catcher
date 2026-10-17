'use strict';
/* Золотой тест: рендер 16 эффектов и миксов через реальный build()/renderWav() в Chrome.
   node tests/golden.js --write   записать tests/golden.json
   node tests/golden.js           сравнить (режим художника выключен → бит в бит).
   Случаи, которые в самом браузере не воспроизводятся бит в бит (модулируемая задержка «Хора»),
   сравниваются по уровню RMS с допуском 0,1 %. */
const fs=require('fs'),path=require('path'),{run}=require('./lib');
const FILE=path.join(__dirname,'golden.json');
(async()=>{
  const r=await run('golden',180000);
  if(!r.ok){console.error('ОШИБКА:',r.error);process.exit(2)}
  const got=r.hashes;
  if(process.argv.includes('--write')){
    fs.writeFileSync(FILE,JSON.stringify(got,null,1));
    console.log('записано',Object.keys(got).length,'случаев; нестабильные:',Object.keys(got).filter(k=>!got[k].stable).join(', ')||'нет');
    return;
  }
  const gold=JSON.parse(fs.readFileSync(FILE,'utf8'));let bad=0,soft=0;
  Object.keys(gold).forEach(k=>{
    const a=gold[k],b=got[k];
    if(!b){bad++;console.log('НЕТ СЛУЧАЯ',k);return}
    if(a.stable&&b.stable){if(a.h!==b.h){bad++;console.log('РАЗЛИЧИЕ',k,a.h,'→',b.h)}}
    else{soft++;if(Math.abs(a.rms-b.rms)>1e-3*Math.max(a.rms,1e-6)){bad++;console.log('РАЗЛИЧИЕ УРОВНЯ',k,a.rms,'→',b.rms)}}
  });
  const n=Object.keys(gold).length;
  console.log(bad?('ПРОВАЛ: '+bad+' из '+n):('OK: '+(n-soft)+' бит в бит, '+soft+' нестабильных по уровню (RMS ±0,1%)'));
  process.exitCode=bad?1:0;
})();
