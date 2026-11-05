// Clone editable JSON containers while preserving immutable Firestore value types.
export function clone(value) {
 if(value instanceof Date)return new Date(value.getTime());
 if(Array.isArray(value))return value.map(clone);
 if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clone(v)]));
 return value;
}
export function fingerprint(value) {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if(value instanceof Date)return 'Date:'+value.toISOString();
  if(typeof value.toJSON==='function')return fingerprint(value.toJSON());
  if(typeof value.path==='string'&&value.firestore)return 'FirestoreRef:'+value.path;
  if (Array.isArray(value)) return '[' + value.map(fingerprint).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + fingerprint(value[k])).join(',') + '}';
}
export const uid = () => crypto.randomUUID();
export const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Taipei'}).format(new Date());
export const dateOf = s => new Date(`${s}T12:00:00`);
export const addDays = (s,n) => { const d=dateOf(s); d.setDate(d.getDate()+n); return iso(d); };
export const diffDays = (a,b) => Math.round((dateOf(b)-dateOf(a))/86400000);
export const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s||'') && Number.isFinite(+dateOf(s)) && iso(dateOf(s))===s;
export function isWorkday(s, calendar={}) {return !(calendar.weekends??[0,6]).includes(dateOf(s).getDay()) && !(calendar.holidays||[]).includes(s);}
export function nextWorkday(s, calendar={}) { for(let i=0;i<3660;i++,s=addDays(s,1)) if(isWorkday(s,calendar)) return s; throw Error('找不到工作日，請檢查休工設定'); }
export function duration(task, calendar={}) {
  if(!validDate(task.start)||!validDate(task.end)||task.end<task.start) return 0;
  if(task.dayMode!=='work') return diffDays(task.start,task.end)+1;
  let n=0;for(let d=task.start;d<=task.end;d=addDays(d,1)) if(isWorkday(d,calendar))n++;return n;
}
export function endFor(start,n,mode='calendar',calendar={}) {
  if(!validDate(start)||!Number.isInteger(n)||n<1||n>3660) throw Error('工期須為 1–3660 天');
  if(mode!=='work') return addDays(start,n-1);
  let d=nextWorkday(start,calendar),count=1;
  while(count<n){d=nextWorkday(addDays(d,1),calendar);count++;}return d;
}
export function validateDependencies(tasks) {
  const byId=new Map(tasks.map(t=>[t.id,t])), visiting=new Set(), done=new Set();
  function visit(t) {
    if(visiting.has(t.id))throw Error('前置工項不能形成循環');if(done.has(t.id))return;
    visiting.add(t.id);
    if(t.dependsOn){const parent=byId.get(t.dependsOn);if(!parent)throw Error('前置工項不存在');visit(parent);}
    visiting.delete(t.id);done.add(t.id);
  }
  tasks.forEach(visit);return true;
}
export function reschedule(tasks, calendar={}) {
  validateDependencies(tasks);const result=tasks.map(clone), byId=new Map(result.map(t=>[t.id,t])),done=new Set();
  function visit(t){if(done.has(t.id))return;if(t.dependsOn){const p=byId.get(t.dependsOn);visit(p);if(t.autoShift){let start=addDays(p.end,1+Number(t.lag||0));if(t.dayMode==='work')start=nextWorkday(start,calendar);if(start>t.start){const n=Math.max(1,duration(t,calendar));t.start=start;t.end=endFor(start,n,t.dayMode,calendar);}}}done.add(t.id);}
  result.forEach(visit);return result;
}
export const BASE_CATS = [
 ['design','設計','#8A80A3'],['demo','拆除','#B9827C'],['mason','泥作','#A29376'],['mep','水電','#7792AF'],['wood','木作','#AF9278'],['iron','鐵件','#84909B'],['glass','玻璃','#7D9EA9'],['paint','油漆','#859D87'],['furn','系統櫃','#AE8599'],['partition','輕隔間','#B3977D'],['light','燈具','#B3A16E'],['sign','招牌','#AB8389'],['floor','地坪','#96918A'],['clean','清潔','#7F9D99'],['soft','傢飾軟裝','#9C87AA']
].map(([key,label,color])=>({key,label,light:[color,color],dark:[color,color]}));
export function categories(project) {
  const cats=[...BASE_CATS,...(project.customCats||[])].map(c=>({...c,color:project.categoryColors?.[c.key]||c.light?.[0]||c.dark?.[0]||'#64748b'}));
  for(const t of project.tasks||[])if(!cats.some(c=>c.key===t.category))cats.push({key:t.category,label:'未分類（保留原分類）',color:'#64748b'});
  return cats;
}
export function textOn(hex) {const rgb=hex.replace('#','').match(/../g)?.map(x=>parseInt(x,16)/255)||[0,0,0];const l=rgb.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*l[0]+.7152*l[1]+.0722*l[2]>.179?'#172024':'#ffffff';}
export function demoProjects() {
 const start=today();const t=(name,category,offset,days,progress)=>({id:uid(),name,category,start:addDays(start,offset),end:addDays(start,offset+days-1),progress});
 return {'demo-home':{name:'日光寓所｜示範專案',tasks:[t('平面配置與設計確認','design',-6,7,100),t('材料選樣與設備確認','design',0,5,40),t('保護工程與現場放樣','demo',3,3,0),t('水電配管與線路配置','mep',6,6,0),t('浴室防水與泥作工程','mason',10,8,0),t('木作天花與收納櫃製作','wood',16,9,0),t('油漆與細部修整','paint',24,5,0),t('燈具安裝與完工清潔','clean',29,3,0)],expenses:[{id:uid(),item:'保護材料',date:start,payer:'設計師',amount:2800}],customCats:[]}};
}

// No constructor/read/subscription path writes. Every project owns its own queue.
export class ProjectStore {
 constructor(adapter,onChange=()=>{},delay=600){this.adapter=adapter;this.onChange=onChange;this.delay=delay;this.entries=new Map();this.timers=new Map();}
 emit(){this.onChange(this);}
 receive(id,raw){
  const e=this.entries.get(id);
  if(!e){if(raw!==null)this.entries.set(id,{base:clone(raw),data:clone(raw),status:'saved',undo:[],redo:[],version:0});this.emit();return;}
  if(e.inflight){e.remote=clone(raw);e.hasRemote=true;return;}
  if(e.status==='saved'){
   if(raw===null){this.entries.delete(id);}else if(fingerprint(raw)!==fingerprint(e.base)){e.base=clone(raw);e.data=clone(raw);e.undo=[];e.redo=[];}
  }else if(fingerprint(raw)!==fingerprint(e.base)){e.remote=clone(raw);e.hasRemote=true;e.status='conflict';clearTimeout(this.timers.get(id));}
  this.emit();
 }
 create(id,data){if(this.entries.has(id))throw Error('專案 ID 已存在');this.entries.set(id,{base:null,data:clone(data),status:'pending',undo:[],redo:[],version:1});this.schedule(id);this.emit();}
 edit(id,transform,history=true){const e=this.entries.get(id);if(!e)throw Error('找不到專案');if(e.status==='conflict')throw Error('請先處理版本衝突');const next=transform(clone(e.data));if(fingerprint(next)===fingerprint(e.data))return;
  if(history){e.undo.push(clone(e.data));if(e.undo.length>60)e.undo.shift();e.redo=[];}
  e.data=next;e.version++;e.status='pending';this.schedule(id);this.emit();
 }
 undo(id){const e=this.entries.get(id);if(!e||!e.undo.length||e.status==='conflict')return;const p=e.undo.pop();e.redo.push(clone(e.data));this.edit(id,()=>p,false);}
 redo(id){const e=this.entries.get(id);if(!e||!e.redo.length||e.status==='conflict')return;const p=e.redo.pop();e.undo.push(clone(e.data));this.edit(id,()=>p,false);}
 schedule(id){clearTimeout(this.timers.get(id));this.timers.set(id,setTimeout(()=>this.flush(id),this.delay));}
 async flush(id){
  clearTimeout(this.timers.get(id));const e=this.entries.get(id);if(!e||e.inflight||e.status==='saved'||e.status==='conflict')return;
  const base=clone(e.base),version=e.version;
  const data={...clone(e.data),updatedAt:new Date().toISOString(),_zenRevision:Number(base?._zenRevision||0)+1};
  e.inflight=true;e.status='saving';this.emit();
  try{await this.adapter.commit(id,base,data);e.base=clone(data);if(e.version===version){e.data=clone(data);e.status='saved';}else e.status='pending';}
  catch(error){e.status=error.code==='conflict'?'conflict':'error';e.error=error.message;if(error.code==='conflict'){e.remote=clone(error.remote);e.hasRemote=true;}}
  finally{e.inflight=false;if(e.hasRemote&&e.status!=='conflict'){const raw=e.remote;e.hasRemote=false;this.receive(id,raw);}this.emit();if(e.status==='pending')this.schedule(id);}
 }
 useRemote(id){const e=this.entries.get(id);if(!e?.hasRemote)throw Error('尚未取得雲端版本，請重試連線');if(e.remote===null){this.entries.delete(id);}else{e.base=clone(e.remote);e.data=clone(e.remote);e.status='saved';e.undo=[];e.redo=[];e.hasRemote=false;}this.emit();}
 dirty(){return [...this.entries.values()].some(e=>e.status!=='saved'||e.inflight);}
 flushAll(){return Promise.all([...this.entries.keys()].map(id=>this.flush(id)));}
 dispose(){for(const t of this.timers.values())clearTimeout(t);}
}
