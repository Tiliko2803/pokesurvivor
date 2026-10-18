"""Export the current development prototype as one offline HTML file.

Usage: python3 tools/build-boss-rush-offline.py /absolute/path/preview.html
Requires the normal sprites for the three starters and Hoenn's major and minor legends.
Does not modify the official or development pages.
"""
import base64
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MINORS = [377, 378, 379, 380, 381, 385, 386]
ROSTER = [254, 257, 260, 382, 383, 384, *MINORS]
ANIMS = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Faint']


def data_url(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def build(destination):
    sprites = {}
    for dex in ROSTER:
        for anim in ANIMS:
            sprites[f'{dex}/{anim}'] = data_url(ROOT / f'assets/pokemon/{dex}/{anim}.png', 'image/png')
    html = (ROOT / 'dev/index.html').read_text()
    html = re.sub(r'<base[^>]*>', '', html)
    html = re.sub(r'<link[^>]*>', '', html)
    css = (ROOT / 'css/style.css').read_text() + '\n' + (ROOT / 'dev/boss-rush.css').read_text()
    for weight in [400, 700]:
        css = css.replace(f'../assets/fonts/PixelifyPS-{weight}.ttf',
                          data_url(ROOT / f'assets/fonts/PixelifyPS-{weight}.ttf', 'font/ttf'))
    if any(not value.strip(' \"\'').startswith('data:') for value in re.findall(r'url\((.*?)\)', css)):
        raise ValueError('Unbundled CSS resource')
    css += '\n#topbar,#credits-line{display:none!important}\n'
    empty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
    bootstrap = 'window.G=window.G||{};G.LOCAL_SPRITES=' + json.dumps(sprites, separators=(',', ':')) + ';G.LOCAL_EMPTY_IMAGE=' + json.dumps(empty) + ';'
    csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; media-src data: blob:;"
    head = '<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<style>' + css + '</style>\n<script>' + bootstrap + '</script>'
    html = html.replace('</head>', head + '\n</head>')
    scripts = []

    def inline(match):
        path = match.group(1).split('?')[0]
        source = (ROOT / path).read_text()
        if path == 'js/core/sprites.js':
            old = 'src: `assets/pokemon/${dex}/${shiny ? \'s/\' : \'\'}${name}.png`'
            new = 'src: G.LOCAL_SPRITES[`${dex}/${shiny ? \'s/\' : \'\'}${name}`] || G.LOCAL_EMPTY_IMAGE'
            if old not in source:
                raise ValueError('Sprite loader has changed: offline export needs updating')
            source = source.replace(old, new)
        if path == 'dev/boss-rush-preview.js':
            source = source.replace('Prueba individual de la ruta de Hoenn.',
                                    'Prueba local sin internet. Menores exclusivos de Hoenn.')
        if path == 'dev/rayquaza-fx.js':
            source = source.replace('assets/boss-rush/rayquaza-attacks-v1.png?v=1', data_url(ROOT / 'assets/boss-rush/rayquaza-attacks-v1.png', 'image/png'))
        source = source.replace('</script', '<\\/script')
        if path == 'dev/boss-rush-sprites.js':
            source = source.replace('assets/boss-rush/attack-atlas-v1.png?v=1', data_url(ROOT / 'assets/boss-rush/attack-atlas-v1.png', 'image/png'))
            source = source.replace('assets/boss-rush/kyogre-beams-v1.png?v=1', data_url(ROOT / 'assets/boss-rush/kyogre-beams-v1.png', 'image/png'))
        scripts.append(path)
        return '<script>\n/* Bundled: ' + path + ' */\n' + source + '\n</script>'

    html = re.sub(r'<script[^>]*src="([^"]+)"[^>]*></script>', inline, html)
    html = html.replace('<title>PokéSurvivor · Boss Rush · Hoenn</title>',
                        '<title>PokéSurvivor · Boss Rush · Prueba local</title>')
    if re.search(r'<script[^>]*src=|<link\b|<base\b', html):
        raise ValueError('External resources remain in exported document')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(html)
    print(json.dumps({'file': str(destination), 'bytes': destination.stat().st_size,
                      'scripts': len(scripts), 'sprites': len(sprites), 'minor_species': MINORS}))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Pass one absolute output HTML path')
    output = Path(sys.argv[1])
    if not output.is_absolute():
        raise SystemExit('Output path must be absolute')
    build(output)
