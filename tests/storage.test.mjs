import test from 'node:test';import assert from 'node:assert/strict';import {ProjectStore,clone} from '../src/core.mjs';
globalThis.location={hostname:'stan-yao.github.io',pathname:'/ZenFlow/',search:''};
const {connect,isDemo}=await import('../src/storage.mjs');
test('production adapter reads without writes, rejects stale data, and uses one atomic transaction after explicit edit',async()=>{
 let callback,writes=0,transactions=0;const database={a:{name:'Original',tasks:[],unknown:{preserve:1}}};
 const col={doc:id=>({id}),onSnapshot:(options,fn)=>{assert.equal(options.includeMetadataChanges,true);callback=fn;return()=>{};}};
 const db={collection:name=>{assert.equal(name,'gantt-projects');return col;},runTransaction:async fn=>{transactions++;const writesQueued=[];const result=await fn({get:async ref=>({exists:!!database[ref.id],data:()=>clone(database[ref.id])}),set:(ref,next)=>writesQueued.push([ref.id,next])});for(const [id,next] of writesQueued){database[id]=clone(next);writes++;}return result;}};
 globalThis.window={firebase:{apps:[{}],firestore:()=>db}};
 const store=new ProjectStore({},()=>{},100000);const connections=[];await connect(store,s=>connections.push(s));assert.equal(isDemo,false);assert.equal(writes,0);assert.equal(transactions,0);
 const snap=(fromCache=false,pending=false)=>({metadata:{fromCache},docs:Object.entries(database).map(([id,data])=>({id,metadata:{hasPendingWrites:pending},data:()=>clone(data)}))});
 callback(snap(true));assert.equal(store.entries.size,0);assert.equal(connections.at(-1),'connecting');
 callback(snap());assert.equal(store.entries.get('a').data.name,'Original');await store.flushAll();assert.equal(writes,0);assert.equal(transactions,0);
 store.edit('a',p=>({...p,name:'Local'}));database.a.name='Other user';await store.flush('a');assert.equal(writes,0);assert.equal(store.entries.get('a').status,'conflict');assert.equal(database.a.name,'Other user');
 store.useRemote('a');store.edit('a',p=>({...p,name:'Intentional edit'}));await store.flush('a');assert.equal(writes,1);assert.equal(database.a.name,'Intentional edit');assert.deepEqual(database.a.unknown,{preserve:1});
 callback(snap(false,true));assert.equal(store.entries.get('a').status,'saved');callback(snap());assert.equal(store.entries.get('a').status,'saved');store.dispose();
});
