"""Проверка интерфейса Звуколовки через Playwright (навык .claude/skills/webapp-testing).

Для облачной сессии Claude Code: на ПК владельца Playwright не работает — политика Windows
запрещает отладочный канал браузера (RemoteDebuggingAllowed=0), и обходить её нельзя.

Запуск из корня репозитория:
    pip install playwright && python -m playwright install chromium
    python .claude/skills/webapp-testing/scripts/with_server.py \
        --server "python -m http.server 8080" --port 8080 -- python tests/ui_check.py

Снимки — в tests/out/ui/, итог — в консоли; код выхода 1, если что-то не так.
"""
import os
import sys
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8080/index.html#sa-test'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'ui')
os.makedirs(OUT, exist_ok=True)
results = []


def check(name, ok, detail=''):
    results.append((bool(ok), name, detail))
    print(('  ✓ ' if ok else '  ✗ ') + name + ((' — ' + str(detail)) if detail else ''))


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, name + '.png'), full_page=False)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'])
    ctx = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2,
                              has_touch=True, is_mobile=True, permissions=['microphone'])
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    # обучение уже «видели» — не мешает проверке
    page.add_init_script("try{localStorage.setItem('zv-tour','{\"seen\":1}')}catch(e){}")
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate("()=>{var s=document.getElementById('splash');if(s)s.remove()}")
    page.wait_for_timeout(500)
    shot(page, '01-start')

    # экран разрешения микрофона: есть «Попробовать без микрофона»
    gate_open = page.evaluate("()=>!document.getElementById('gate').classList.contains('hide')")
    if gate_open:
        check('экран микрофона: есть «Попробовать без микрофона»', page.locator('#gateDemo').is_visible())
        page.locator('#gateDemo').click()
    else:
        check('главный экран: есть «Попробовать без микрофона»', page.locator('#demoBtn').is_visible())
        page.locator('#demoBtn').click()
    page.wait_for_timeout(300)
    n = page.locator('#dpGrid .dpb').count()
    check('окно готовых звуков: 9 звуков', n == 9, n)
    shot(page, '02-picker')
    page.locator('#dpGrid [data-demo=cat]').click()
    page.wait_for_timeout(800)
    shot(page, '03-result')
    check('после выбора — экран результата', page.locator('#fx').is_visible())
    check('строка «Звучит: как было»', 'как было' in page.locator('#now').inner_text())

    # эффект → чип; ✕ → снова «как было»
    page.locator('#grid .t[data-id=echo]').click()
    page.wait_for_timeout(700)
    chips = page.locator('#now .chip:not(.calm)').all_inner_texts()
    check('нажал Эхо — чип «Эхо 25%»', any('Эхо' in c for c in chips), chips)
    shot(page, '04-effect')
    page.locator('#undo').click()
    page.wait_for_timeout(300)
    check('↶ — снова без эффектов', 'как было' in page.locator('#now').inner_text())
    page.locator('#redo').click()
    page.wait_for_timeout(300)
    page.locator('#ab').click()
    page.wait_for_timeout(200)
    check('⇄ — «как было» (кнопка нажата)', page.locator('#ab').get_attribute('aria-pressed') == 'true')
    page.locator('#ab').click()
    page.locator('#resetAll').click()
    page.wait_for_timeout(300)
    check('↺ — всё как было', page.locator('#resetAll').is_disabled())

    # плеер прилипает к верху
    page.mouse.wheel(0, 4000)
    page.wait_for_timeout(400)
    box = page.locator('#play').bounding_box()
    check('при прокрутке ▶ остаётся сверху', box and 0 <= box['y'] < 120, box)
    shot(page, '05-scrolled')

    # все видимые кнопки не меньше 44 px
    small = page.evaluate("""()=>[].filter.call(document.querySelectorAll('button'),function(b){
        var r=b.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<44||r.height<44)&&!b.closest('#tour,#tourPick')
      }).map(function(b){var r=b.getBoundingClientRect();return (b.id||b.className)+' '+Math.round(r.width)+'×'+Math.round(r.height)})""")
    check('кнопки не меньше 44 px', not small, small[:5])

    # запись с поддельным микрофоном: виден уровень
    page.mouse.wheel(0, -8000)
    page.wait_for_timeout(300)
    page.locator('#rec').click()
    page.wait_for_timeout(1200)
    lvl = page.locator('#lvl').get_attribute('aria-valuenow')
    check('во время записи виден уровень микрофона', lvl is not None and int(lvl) > 0, lvl)
    shot(page, '06-recording')
    page.locator('#rec').click()
    page.wait_for_timeout(1500)

    # мир: фон не реагирует, рамки «Рисуй здесь»
    page.locator('#portal').click()
    page.wait_for_timeout(1500)
    page.evaluate("()=>{var t=document.getElementById('tourPick');if(t)t.hidden=true}")
    check('мир: подпись про фон', page.locator('#wNote').is_visible())
    page.locator('#ecHere').scroll_into_view_if_needed()
    shot(page, '07-world-echo')
    check('мир: холст эха с ярлыком «Рисуй здесь»', page.locator('#ecHere').is_visible())
    page.locator('#crvHere').scroll_into_view_if_needed()
    shot(page, '08-world-curves')

    check('ошибок в консоли нет', not errors, errors[:3])
    browser.close()

bad = [r for r in results if not r[0]]
print('\nИтого: ✓ %d  ✗ %d · снимки: %s' % (len(results) - len(bad), len(bad), OUT))
sys.exit(1 if bad else 0)
