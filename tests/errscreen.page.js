/* Z5: экран ошибки вместо белого. #sa-test&run=errscreen */
(async function(){
  var results=[];
  function report(o){return window.fetch('/report',{method:'POST',body:JSON.stringify(o)})}
  function check(name,ok,detail){results.push({name:name,ok:!!ok,detail:detail||''})}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
  try{
    try{localStorage.setItem('zv-tour','{"seen":1}')}catch(e){}
    var html=await (await fetch('/index.html')).text();
    async function load(src,isDoc){
      var fr=document.createElement('iframe');
      fr.style.cssText='position:fixed;left:0;top:0;width:375px;height:812px;border:0';
      if(isDoc)fr.srcdoc=src;else fr.src=src;
      document.body.appendChild(fr);await new Promise(function(r){fr.onload=r});await sleep(500);return fr;
    }
    var MARK='var MAX=15000, MIN_DUR=0.25';
    check('маркер для подмены кода найден (один раз)',html.split(MARK).length===2);

    /* обычная страница: экрана нет, флаг готовности стоит */
    var f1=await load('/index.html',false),W=f1.contentWindow,D=f1.contentDocument;
    check('нормальный запуск: экрана ошибки нет, window.__zvReady = true',!D.getElementById('zvErr')&&W.__zvReady===true);
    W.dispatchEvent(new W.ErrorEvent('error',{message:'поздняя ошибка',lineno:1}));await sleep(100);
    check('ошибка уже после запуска экран не закрывает',!D.getElementById('zvErr'));
    f1.remove();

    /* падение при запуске: исключение */
    var f2=await load(html.replace(MARK,"throw new Error('test-boom');"+MARK),true);D=f2.contentDocument;W=f2.contentWindow;
    var e=D.getElementById('zvErr'),rc=e&&e.getBoundingClientRect();
    check('исключение при запуске: экран ошибки показан',!!e);
    check('экран закрывает весь вид (375×812), поверх всего',!!e&&rc.width>=374&&rc.height>=811&&D.elementFromPoint(187,400)&&e.contains(D.elementFromPoint(187,400)));
    check('в экране: заголовок, подсказка про Safari/Chrome, текст ошибки и строка',!!e&&/Что-то пошло не так/.test(e.textContent)&&/Safari или Chrome/.test(e.textContent)&&/test-boom/.test(e.textContent)&&/строка \d+/.test(e.textContent),e&&e.textContent.slice(0,200));
    check('экран один (повторные ошибки не плодят окна), role=alert',D.querySelectorAll('#zvErr').length===1&&e.getAttribute('role')==='alert');
    check('в экране нет адреса страницы (только текст и строка)',!/https?:\/\//.test(e.textContent));
    f2.remove();

    /* падение при запуске: синтаксическая ошибка */
    var f3=await load(html.replace(MARK,"var x = ;"+MARK),true);D=f3.contentDocument;
    e=D.getElementById('zvErr');
    check('синтаксическая ошибка при запуске: экран ошибки показан',!!e&&/SyntaxError/.test(e.textContent),e&&e.textContent.slice(-120));
    f3.remove();

    /* длинное сообщение обрезается */
    var f4=await load(html.replace(MARK,"throw new Error('"+new Array(600).join('x')+"');"+MARK),true);D=f4.contentDocument;
    e=D.getElementById('zvErr');
    check('длинное сообщение обрезано (≤ 300 знаков в выдержке)',!!e&&e.querySelector('pre').textContent.length<=300,e&&String(e.querySelector('pre').textContent.length));
    f4.remove();

    report({ok:true,results:results});
  }catch(e){report({ok:false,error:String(e&&e.stack||e),results:results})}
})();
