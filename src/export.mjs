import {addDays,diffDays,categories,dateOf,textOn,today} from './core.mjs';
export function downloadJSON(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name.replace(/[<>:"/\\|?*]/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function exportJPG(project,tasks){
 if(!tasks.length)throw Error('目前沒有可匯出的工項');
 const sorted=[...tasks].sort((a,b)=>a.start.localeCompare(b.start));const start=sorted.reduce((d,t)=>t.start<d?t.start:d,sorted[0].start),end=sorted.reduce((d,t)=>t.end>d?t.end:d,sorted[0].end);
 const days=diffDays(start,end)+3,row=48,side=290,dw=Math.max(3,Math.min(30,1800/days)),w=Math.ceil(side+days*dw+30),h=130+row*sorted.length+44;
 if(h>16000||w*h>24000000)throw Error('工項過多，請先使用分類或搜尋縮小匯出範圍');
 const scale=w*h<6000000?2:1,cv=document.createElement('canvas');cv.width=w*scale;cv.height=h*scale;const ctx=cv.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#202827';ctx.font='600 22px system-ui';ctx.fillText(project.name||'專案',24,38,w-48);ctx.font='12px system-ui';ctx.fillStyle='#596462';ctx.fillText(`${start} — ${end}  ·  ${tasks.length} 項工項  ·  匯出 ${today()}`,24,65);
 ctx.fillStyle='#edf2f0';ctx.fillRect(0,90,w,40);ctx.fillStyle='#596462';ctx.fillText('工項 / 起訖日期',24,115);
 for(let i=0;i<days;i++){const d=addDays(start,i),x=side+i*dw;if([0,6].includes(dateOf(d).getDay())){ctx.fillStyle='#f6f7f6';ctx.fillRect(x,130,dw,h-160);}if(dw>=16||i%Math.ceil(40/dw)===0){ctx.fillStyle='#596462';ctx.font='10px system-ui';ctx.fillText(d.slice(5),x,112);}}
 const cats=categories(project);
 sorted.forEach((t,i)=>{const y=130+i*row,c=cats.find(c=>c.key===t.category)?.color||'#64748b';ctx.strokeStyle='#e7ebe8';ctx.beginPath();ctx.moveTo(0,y+row);ctx.lineTo(w,y+row);ctx.stroke();ctx.fillStyle='#202827';ctx.font='500 13px system-ui';ctx.fillText(t.name,24,y+20,side-44);ctx.fillStyle='#596462';ctx.font='11px system-ui';ctx.fillText(`${t.start.slice(5)}–${t.end.slice(5)} · ${t.progress||0}%`,24,y+37);const x=side+diffDays(start,t.start)*dw,bw=Math.max(3,(diffDays(t.start,t.end)+1)*dw);ctx.fillStyle=c;ctx.fillRect(x,y+10,bw,27);ctx.fillStyle=textOn(c);ctx.font='11px system-ui';if(bw>65)ctx.fillText(t.name,x+6,y+28,bw-12);});
 ctx.fillStyle='#596462';ctx.font='11px system-ui';ctx.fillText('ZenFlow · 工期規劃',24,h-14);return {filename:(project.name||'專案').replace(/[<>:"/\\|?*]/g,'_')+'-工期表.jpg',url:cv.toDataURL('image/jpeg',.95),width:cv.width,height:cv.height};
}
