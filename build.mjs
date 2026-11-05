import {build} from 'esbuild';
import fs from 'node:fs';import {createHash} from 'node:crypto';
await build({entryPoints:['src/app.jsx'],bundle:true,minify:true,sourcemap:false,outfile:'assets/app.js',format:'iife',target:['es2020'],legalComments:'eof'});
let html=fs.readFileSync('index.html','utf8');
for(const ext of ['js','css']){const hash=createHash('sha256').update(fs.readFileSync('assets/app.'+ext)).digest('hex').slice(0,12);html=html.replace(new RegExp('\\./assets/app\\.'+ext+'(?:\\?v=[a-f0-9]+)?','g'),'./assets/app.'+ext+'?v='+hash);}
fs.writeFileSync('index.html',html);
