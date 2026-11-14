import {build} from 'esbuild';
import fs from 'node:fs';import {createHash} from 'node:crypto';
await build({entryPoints:['src/app.jsx'],bundle:true,minify:true,sourcemap:false,outfile:'assets/app.js',format:'iife',target:['es2020'],legalComments:'eof'});
let html=fs.readFileSync('app.html','utf8');
for(const ext of ['js','css']){const hash=createHash('sha256').update(fs.readFileSync('assets/app.'+ext)).digest('hex').slice(0,12);html=html.replace(new RegExp('\\./assets/app\\.'+ext+'(?:\\?v=[a-f0-9]+)?','g'),'./assets/app.'+ext+'?v='+hash);}
fs.mkdirSync('cloudflare-public/assets',{recursive:true});
fs.writeFileSync('cloudflare-public/index.html',html);
for(const name of ['app.js','app.css'])fs.copyFileSync('assets/'+name,'cloudflare-public/assets/'+name);
for(const name of ['icon.png','icon-touch.png'])fs.copyFileSync(name,'cloudflare-public/'+name);
