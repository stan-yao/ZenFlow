import {clone,fingerprint,demoProjects} from './core.mjs';
import config from './firebase-config.js';
export const isDemo=location.hostname!=='stan-yao.github.io'||!location.pathname.startsWith('/ZenFlow/')||new URLSearchParams(location.search).has('demo');
const conflict=remote=>Object.assign(Error('其他人已更新此專案；你的草稿已保留，尚未覆寫雲端。'),{code:'conflict',remote});
const DEMO_KEY='zenflow-v9-demo';
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error('雲端連線元件載入失敗'));document.head.append(el);});}
export async function connect(store,onConnection){
 if(isDemo){
  let data;try{data=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');}catch{}
  data=data||demoProjects();
  store.adapter.commit=async(id,base,next)=>{let latest;try{latest=JSON.parse(localStorage.getItem(DEMO_KEY)||'null')||data;}catch{throw Error('本機資料無法讀取，請先下載草稿');}if(fingerprint(latest[id]??null)!==fingerprint(base))throw conflict(latest[id]??null);latest[id]=clone(next);localStorage.setItem(DEMO_KEY,JSON.stringify(latest));data=latest;};
  Object.entries(data).forEach(([id,p])=>store.receive(id,p));
  const listener=e=>{if(e.key!==DEMO_KEY||!e.newValue)return;try{data=JSON.parse(e.newValue);for(const id of new Set([...store.entries.keys(),...Object.keys(data)]))store.receive(id,data[id]??null);}catch{onConnection('error');}};
  window.addEventListener('storage',listener);onConnection('ready');return()=>window.removeEventListener('storage',listener);
 }
 if(!window.firebase)await script('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
 if(!window.firebase.firestore)await script('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
 if(!window.firebase.apps.length)window.firebase.initializeApp(config);
 const db=window.firebase.firestore(),col=db.collection('gantt-projects');
 store.adapter.commit=(id,base,next)=>db.runTransaction(async tx=>{const ref=col.doc(id),snapshot=await tx.get(ref),remote=snapshot.exists?snapshot.data():null;if(fingerprint(remote)!==fingerprint(base))throw conflict(remote);tx.set(ref,next);});
 return col.onSnapshot({includeMetadataChanges:true},snapshot=>{
  // Wait for an authoritative server read; do not mark offline cache as current.
  if(snapshot.metadata.fromCache){onConnection('connecting');return;}
  const found=new Set();snapshot.docs.forEach(doc=>{found.add(doc.id);if(!doc.metadata?.hasPendingWrites)store.receive(doc.id,doc.data());});
  for(const [id,e] of store.entries)if(!found.has(id)&&e.base!==null)store.receive(id,null);
  onConnection('ready');
 },()=>onConnection('error'));
}
