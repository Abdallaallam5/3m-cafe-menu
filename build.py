#!/usr/bin/env python3
"""Builds index.html and sw.js from their templates.
Run after editing data/menu.json or any asset:  python3 build.py
It refreshes the precache list and the cache version (a hash of all files),
so customers get the new menu automatically."""
import hashlib, json, pathlib
root = pathlib.Path(__file__).parent
frond = (root / 'src/frond-symbol.svgfrag').read_text()
html = (root / 'index.template.html').read_text().replace('%%FROND%%', frond)
(root / 'index.html').write_text(html)
assets = ['./', 'index.html', 'manifest.json', 'css/styles.css', 'js/app.js', 'data/menu.json']
for p in sorted((root / 'assets').rglob('*')):
    if p.is_file() and p.suffix in {'.webp', '.png', '.woff2', '.jpg'} and 'og.jpg' not in p.name:
        assets.append(p.relative_to(root).as_posix())
h = hashlib.sha256()
for a in assets[1:]:
    h.update((root / a).read_bytes())
version = h.hexdigest()[:10]
sw = (root / 'sw.template.js').read_text().replace('%%VERSION%%', version).replace('%%ASSETS%%', json.dumps(assets, indent=2))
(root / 'sw.js').write_text(sw)
print(f'built: {len(assets)} precached files, cache version {version}')
