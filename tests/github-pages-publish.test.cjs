'use strict';
// Regresión de publicación GitHub Pages: el usuario juega en el SUBDIRECTORIO
// /pokesurvivor/, no en el dominio original ni en Pages de Cloudflare.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const dev=read('dev.html');
const config=read('js/core/firebase-config.js');
const scripts=h=>[...h.matchAll(/<script defer src="(js\/[^"]+\.js)"\s*><\/script>/g)].map(m=>m[1]);

test('GitHub Pages sirve 74 módulos originales o el bundle reconstruido por GitHub Actions',()=>{
 const src=scripts(dev),prod=scripts(html);
 assert.equal(src.length,74);
 for(const p of src)assert.ok(fs.existsSync(path.join(root,p)),'Falta '+p);
 for(const must of ['js/data/maomao-preview.js','js/data/maomao-animation.js',
                    'js/data/gift-codes.js','js/ui/gifts-ui.js'])
   assert.ok(src.includes(must));
 assert.equal(src.at(-1),'js/main.js');
 const bundle=html.includes('src="js/app.min.js?v=') ? [null,html.split('src="js/app.min.js?v=')[1].split('"')[0]] : null;
 if(bundle){
   // El workflow genera index.html + bundle OFUSCADO desde dev.html.
   assert.equal(prod.length,0);
   assert.ok(fs.statSync(path.join(root,'js/app.min.js')).size>100000);
   assert.equal(bundle[1],JSON.parse(read('version.json')).v);
 }else{
   // Vista intermedia antes del workflow: módulos directos actualizados.
   assert.deepEqual(prod,src);
 }
});

test('GitHub Pages utiliza la raíz /pokesurvivor/ sin reclamar dominio ajeno',()=>{
 assert.equal(fs.existsSync(path.join(root,'CNAME')),false);
 assert.match(html,/https:\/\/tiliko2803\.github\.io\/pokesurvivor\//);
 assert.doesNotMatch(html,/https:\/\/pokesurvivor\.com\//);
 if(!html.includes('src="js/app.min.js?v=')){
   assert.match(html,/name="ps-version"/);
   assert.ok(html.includes('href="css/style.css?v=tiliko-gh05"'));
 }
});

test('Nube sólo en GitHub Pages de Tiliko, Cloudflare Tiliko y HTTPS',()=>{
 function conf(host,pathname,protocol='https:'){
  const ctx={G:{},location:{hostname:host,pathname,protocol}};
  vm.runInNewContext(config,ctx);
  return ctx.G.FIREBASE_CONFIG;
 }
 assert.equal(conf('tiliko2803.github.io','/pokesurvivor/').projectId,'pokesurvivor-tiliko');
 assert.equal(conf('tiliko2803.github.io','/pokesurvivor/index.html').projectId,'pokesurvivor-tiliko');
 assert.equal(conf('tiliko2803.github.io','/otro/'),null);
 assert.equal(conf('tiliko2803.github.io','/'),null);
 assert.equal(conf('tiliko2803.github.io','/pokesurvivor/','http:'),null);
 assert.equal(conf('jpter78.github.io','/pokesurvivor/'),null);
 assert.equal(conf('pokesurvivor.com','/'),null);
 assert.equal(conf('pokesurvivor-tiliko.pages.dev','/').projectId,'pokesurvivor-tiliko');
});

test('La versión publicada, la caché y el control de actualizaciones coinciden',()=>{
 const v=JSON.parse(read('version.json')).v;
 const inline=html.match(/name="ps-version" content="([^"]+)"/);
 const compiled=html.includes('src="js/app.min.js?v=') ? [null,html.split('src="js/app.min.js?v=')[1].split('"')[0]] : null;
 assert.equal((compiled&&compiled[1])||(inline&&inline[1]),v);
 assert.match(read('sw.js'),/ps-code-v2-ghmaomao/);
 assert.match(read('js/core/updater.js'),/meta\[name="ps-version"\]/);
});

test('Mao Mao conserva poder Kyogre, regalo MAO25 y Picotazo Veneno',()=>{
 const mon=read('js/data/maomao-preview.js');
 assert.match(mon,/hp:\s*110,\s*spd:\s*112,\s*atk:\s*1\.52/);
 assert.match(mon,/start:\s*'poison-sting'/);
 assert.match(read('js/data/gift-codes.js'),/MAO25/);
 const tabs=read('js/ui/menu.js');
 assert.match(tabs,/Especial/);
});
