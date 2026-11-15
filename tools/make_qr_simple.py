#!/usr/bin/env python3
"""Simple QR card: logo + QR + one line. Usage: python3 tools/make_qr_simple.py https://url"""
import base64, pathlib, sys, asyncio
import qrcode
from qrcode.constants import ERROR_CORRECT_H
URL = sys.argv[1]
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'qr'; OUT.mkdir(exist_ok=True)
q = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=40, border=0); q.add_data(URL); q.make(fit=True)
qimg = q.make_image(fill_color='#2b180e', back_color='white').convert('RGB'); tmp = OUT / '_qr.png'; qimg.save(tmp)
b64 = lambda p, m: f'data:{m};base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
F = ROOT / 'assets/fonts'
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Cinzel;src:url({b64(F/'cinzel-latin-700-normal.woff2','font/woff2')})}}
@page{{size:120mm 160mm;margin:0}} html,body{{margin:0}}
.c{{width:120mm;height:160mm;background:#f6ead8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6mm;box-sizing:border-box;border:1.2mm solid #f6ead8;outline:.5mm solid #c99a3b;outline-offset:-5mm}}
.logo{{width:38mm}}
.q{{background:#fff;padding:10mm;border-radius:4mm}} .q img{{width:64mm;height:64mm;display:block}}
p{{margin:0;font-family:Cinzel;font-size:4.6mm;letter-spacing:.9mm;color:#2b180e}}
</style></head><body><div class="c">
<img class="logo" src="{b64(ROOT/'assets/img/logo.png','image/png')}">
<div class="q"><img src="{b64(tmp,'image/png')}"></div>
<p>SCAN TO VIEW OUR MENU</p></div></body></html>"""
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':454,'height':605}, device_scale_factor=4)
        await pg.set_content(html); await pg.wait_for_timeout(400)
        await pg.screenshot(path=str(OUT/'3m-cafe-qr-card.png'))
        await pg.pdf(path=str(OUT/'3m-cafe-qr-card.pdf'), width='120mm', height='160mm', print_background=True)
        await b.close()
asyncio.run(main()); tmp.unlink(); print('ok')
