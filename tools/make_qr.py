#!/usr/bin/env python3
"""Generate the 3M cafe menu QR code (PNG) and a print-ready A4 poster (PDF + PNG preview).
Usage:  python3 tools/make_qr.py https://your-final-menu-url
Needs:  pip install qrcode pillow playwright && python3 -m playwright install chromium
"""
import base64, io, pathlib, sys, asyncio
import qrcode
from qrcode.constants import ERROR_CORRECT_H

if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
    sys.exit('usage: make_qr.py https://final-public-url')
URL = sys.argv[1]
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'qr'; OUT.mkdir(exist_ok=True)

# ---- QR PNG (high-res, generous quiet zone, high error correction) ----
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=1, border=4)
qr.add_data(URL); qr.make(fit=True)
n = qr.modules_count + 8
box = max(1, 2400 // n)
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=box, border=4)
qr.add_data(URL); qr.make(fit=True)
img = qr.make_image(fill_color='#1e1009', back_color='white').convert('RGB')
png = OUT / '3m-cafe-menu-qr.png'
img.save(png, dpi=(600, 600))
print('QR:', png, img.size)

def b64(p, mime):
    return f'data:{mime};base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

frond = (ROOT / 'src/frond-symbol.svgfrag').read_text()
fonts = ROOT / 'assets/fonts'
html = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{{font-family:Messiri;src:url({b64(fonts/'el-messiri-arabic-700-normal.woff2','font/woff2')})}}
@font-face{{font-family:Cairo;src:url({b64(fonts/'cairo-arabic-700-normal.woff2','font/woff2')})}}
@font-face{{font-family:Cinzel;src:url({b64(fonts/'cinzel-latin-700-normal.woff2','font/woff2')})}}
@font-face{{font-family:GV;src:url({b64(fonts/'great-vibes-latin-400-normal.woff2','font/woff2')})}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}}html,body{{margin:0}}
.page{{position:relative;width:210mm;height:297mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;
 background:radial-gradient(ellipse at 50% 28%,#fff6e6,transparent 60%),linear-gradient(180deg,#f4e1c4,#e6c9a1);font-family:Cairo}}
.frame{{position:absolute;inset:7mm;border:1.2mm solid #4a2814;border-radius:3mm;box-shadow:inset 0 0 0 1.6mm #f1dcbc,inset 0 0 0 2.1mm #c99a3b}}
.palm{{position:absolute;top:-8mm;width:105mm}} .palm svg{{position:absolute;top:0;left:0;width:100%;height:auto}}
.pl{{left:-12mm}} .pr{{right:-12mm;transform:scaleX(-1)}}
.r2{{transform:rotate(28deg);transform-origin:2% 18%}} .r3{{transform:rotate(-22deg) scale(.82);transform-origin:2% 18%}}
.logo{{width:48mm;margin-top:12mm;position:relative;z-index:2;filter:drop-shadow(0 2mm 3mm rgba(60,30,10,.35))}}
h1{{font-family:Messiri;font-size:14mm;margin:0;color:#3d2314;line-height:1.1;display:flex;align-items:center;gap:5mm}}
h1:before,h1:after{{content:"";width:16mm;height:.5mm;background:#5a3520}}
.script{{font-family:GV;font-size:10mm;color:#5a3520;margin:0 0 4mm;word-spacing:2mm}}
.scan{{font-family:Cinzel;font-size:9.4mm;letter-spacing:1.2mm;color:#f3d98e;background:linear-gradient(180deg,#71431f,#3e2212);
 border:.7mm solid #c99a3b;border-radius:30mm;padding:3mm 11mm;box-shadow:0 0 0 1.4mm rgba(201,154,59,.3)}}
.ar{{font-family:Messiri;font-size:6.5mm;color:#3d2314;margin:2mm 0 4mm}}
.qrcard{{position:relative;z-index:3;background:#fff;padding:6mm;border-radius:6mm;border:1.2mm solid #c99a3b;box-shadow:0 0 0 2.4mm #4a2814,0 4mm 10mm rgba(43,24,14,.35)}}
.qrcard img{{display:block;width:76mm;height:76mm;image-rendering:pixelated}}
.url{{font-family:Cairo;direction:ltr;font-size:3.6mm;color:#5a3520;margin-top:5mm;letter-spacing:.3mm;position:relative;z-index:3}}
.scene{{position:absolute;bottom:9mm;width:118mm;z-index:1;opacity:.95;-webkit-mask:radial-gradient(ellipse 50% 60% at 50% 60%,#000 50%,transparent 100%)}}
</style></head><body><div class="page">
<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f7b34"/><stop offset=".55" stop-color="#4d5a22"/><stop offset="1" stop-color="#2e3814"/></linearGradient></defs>{frond}</svg>
<div class="palm pl"><svg viewBox="-20 -60 460 360"><use href="#frond"/></svg><svg class="r2" viewBox="-20 -60 460 360"><use href="#frond"/></svg><svg class="r3" viewBox="-20 -60 460 360"><use href="#frond"/></svg></div>
<div class="palm pr"><svg viewBox="-20 -60 460 360"><use href="#frond"/></svg><svg class="r2" viewBox="-20 -60 460 360"><use href="#frond"/></svg><svg class="r3" viewBox="-20 -60 460 360"><use href="#frond"/></svg></div>
<img class="scene" src="{b64(ROOT/'assets/img/hero-scene.webp','image/webp')}">
<div class="frame"></div>
<img class="logo" src="{b64(ROOT/'assets/img/logo.png','image/png')}">
<h1>ليالي بيروت</h1>
<div class="script" dir="ltr">Good Vibes... Great Coffee</div>
<div class="scan" dir="ltr">SCAN TO VIEW OUR MENU</div>
<div class="ar">امسح الكود لعرض المنيو</div>
<div class="qrcard"><img src="{b64(png,'image/png')}"></div>
<div class="url">{URL}</div>
</div></body></html>"""
(OUT / 'poster.html').write_text(html)

async def render():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.set_content(html, wait_until='networkidle'); await pg.wait_for_timeout(500)
        await pg.pdf(path=str(OUT / '3m-cafe-menu-poster-A4.pdf'), format='A4', print_background=True, prefer_css_page_size=True)
        await pg.set_viewport_size({'width': 794, 'height': 1123})
        await pg.screenshot(path=str(OUT / '3m-cafe-menu-poster-preview.png'), scale='device', full_page=False)
        await b.close()
asyncio.run(render())
(OUT / 'poster.html').unlink()
print('Poster:', OUT / '3m-cafe-menu-poster-A4.pdf')
