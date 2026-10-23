'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('existing dev URL loads isolated TFT modules and retains Hoenn guest adapter',()=>{
 const html=read('dev/index.html');assert.match(html,/<base href="\.\.\/">/);
 assert.match(html,/id="btn-tft"/);assert.match(html,/id="btn-boss-rush"/);
 for(const f of ['engine','ui','enemies','shared-ui','changelog'])assert.match(html,new RegExp('dev/js/tft/'+f+'\\.js\\?v=tft-'));
 assert.match(html,/dev\/boss-rush-preview\.js/);assert.match(html,/dev\/boss-rush-boot\.js/);
 assert.doesNotMatch(html,/src="js\/core\/firebase-config\.js|src="js\/main\.js|src="js\/app\.min\.js/);
 assert.match(html,/G\.FIREBASE_CONFIG = null/);
 assert.ok(html.indexOf('dev/js/tft/enemies.js')<html.indexOf('dev/js/tft/engine.js'));
 for(const match of html.matchAll(/(?:src|href)="([^"?]+)(?:\?[^"]*)?"/g)) {
  if(!match[1].startsWith('http')&&!match[1].startsWith('#'))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
 }
});
test('preview assets match source and have a screen registry and portrait support',()=>{
 const files={'js/tft/engine.js':'dev/js/tft/engine.js','js/tft/ui.js':'dev/js/tft/ui.js','js/ui/ui.js':'dev/js/tft/shared-ui.js',
  'js/data/enemies.js':'dev/js/tft/enemies.js','js/data/changelog.js':'dev/js/tft/changelog.js','css/style.css':'dev/style.css'};
 for(const [a,b]of Object.entries(files))assert.equal(read(a),read(b),b);
 assert.match(read('dev/js/tft/shared-ui.js'),/'scr-tft'/);
 assert.match(read('dev/style.css'),/body\.tft-active #rotate/);
 assert.match(read('dev/boss-rush-preview.js'),/G\.Updater\.init = \(\) => \{\}/);
});
