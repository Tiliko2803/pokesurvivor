/* Add TFT to the existing /dev/ preview. Publish only the returned dev/ files.
 * Does not edit the official index.html, root styles, sources or version.json.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),root=path.join(__dirname,'..');
execFileSync(process.execPath,[path.join(__dirname,'build-boss-rush-preview.cjs')],{stdio:'inherit'});
const copies={
 'js/tft/engine.js':'dev/js/tft/engine.js',
 'js/tft/ui.js':'dev/js/tft/ui.js',
 'js/tft/visuals.js':'dev/js/tft/visuals.js',
 'js/ui/ui.js':'dev/js/tft/shared-ui.js',
 'js/data/enemies.js':'dev/js/tft/enemies.js',
 'js/data/changelog.js':'dev/js/tft/changelog.js',
 'css/style.css':'dev/style.css'
};
let html=fs.readFileSync(path.join(root,'dev/index.html'),'utf8').replace('G.FIREBASE_CONFIG = null;','G.FIREBASE_CONFIG = null; G.TFT_PREVIEW = true;');
for(const [src,dest] of Object.entries(copies)) {
 fs.mkdirSync(path.dirname(path.join(root,dest)),{recursive:true});
 fs.copyFileSync(path.join(root,src),path.join(root,dest));
 html=html.replaceAll(`src="${src}?`,`src="${dest}?`).replaceAll(`href="${src}?`,`href="${dest}?`);
}
html=html.replace(/<title>.*?<\/title>/,'<title>PokéSurvivor · Pruebas · TFT y Hoenn</title>')
 .replace(/\?v=bossrush-[0-9a-f]+/g,'')
 .replace(/<meta name="ps-preview-version"[^>]*>\n/,'')
 .replace('isolated Hoenn preview.','isolated TFT and Hoenn preview.');
const scripts=[...html.matchAll(/<script[^>]*src="([^"?]+)(?:\?[^"]*)?"/g)].map(m=>m[1]);
const styles=[...html.matchAll(/<link[^>]*href="([^"?]+\.css)(?:\?[^"]*)?"/g)].map(m=>m[1]);
const hash=crypto.createHash('sha1').update(html+[...scripts,...styles].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n')).digest('hex').slice(0,10);
html=html.replace(/(<script[^>]*src="[^"?]+)(?:\?[^"]*)?"/g,`$1?v=tft-${hash}"`)
 .replace(/(<link[^>]*href="[^"?]+\.css)(?:\?[^"]*)?"/g,`$1?v=tft-${hash}"`)
 .replace('<meta charset="utf-8">',`<meta charset="utf-8">\n<meta name="ps-preview-version" content="${hash}">`);
fs.writeFileSync(path.join(root,'dev/index.html'),html);
console.log(`Generated existing /dev/ preview · TFT + Hoenn · ${hash}`);
console.log('Preview publish files: '+JSON.stringify(['dev/index.html',...Object.values(copies)]));
