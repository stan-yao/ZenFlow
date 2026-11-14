import test from 'node:test';import assert from 'node:assert/strict';
globalThis.location={hostname:'localhost',pathname:'/',search:''};
const {isProductionLocation}=await import('../src/storage.mjs');
test('only explicit live origins use Firebase; demos stay isolated',()=>{
 const loc=(hostname,pathname='/',search='')=>({hostname,pathname,search});
 assert(isProductionLocation(loc('zenflow.zenordesign.workers.dev')));
 assert(isProductionLocation(loc('stan-yao.github.io','/ZenFlow/')));
 assert(isProductionLocation(loc('zenorhub.pages.dev','/flow/')));
 assert.equal(isProductionLocation(loc('zenorhub.pages.dev','/cost/')),false);
 assert.equal(isProductionLocation(loc('preview.zenorhub.pages.dev','/flow/')),false);
 assert.equal(isProductionLocation(loc('zenorhub.pages.dev','/flow/','?demo')),false);
 for(const l of [loc('localhost'),loc('preview.zenordesign.workers.dev'),loc('evil-zenflow.zenordesign.workers.dev'),loc('zenflow.zenordesign.workers.dev','/','?demo'),loc('stan-yao.github.io','/Other/')])assert.equal(isProductionLocation(l),false);
});
