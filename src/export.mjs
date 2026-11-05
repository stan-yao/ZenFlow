import {addDays,diffDays,categories,dateOf,textOn,today,duration} from './core.mjs';
import {GANTT,dateStep,rangeFor} from './gantt-style.mjs';
export function downloadJSON(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name.replace(/[<>:"/\\|?*]/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function exportJPG(project,tasks,options={}){
 const {start,total,sorted}=rangeFor(tasks,today());
 if(!sorted.length)throw Error('目前沒有可匯出的工項');
 const dw=Math.max(.15,Math.min(200,options.dayWidth||30)),side=options.sidebar||270,top=82,row=GANTT.row,head=GANTT.header;
 const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),font=(size=13,weight=500)=>`${weight} ${size}px ${GANTT.fontFamily}`;
 ctx.font=font();
 const labelEnd=Math.max(...sorted.map(t=>side+diffDays(start,t.start)*dw+GANTT.padding+ctx.measureText(t.name).width+20));
 const days=Math.max(total,Math.ceil((labelEnd-side)/dw)),w=Math.ceil(side+days*dw),h=top+head+row*sorted.length+32;
 if(w>16000||h>16000||w*h>24000000)throw Error('匯出範圍過大，請降低縮放或先篩選工項');
 const scale=w*h<6000000&&Math.max(w,h)<=8000?2:1;cv.width=w*scale;cv.height=h*scale;ctx.scale(scale,scale);
 const css=getComputedStyle(document.documentElement),color=k=>css.getPropertyValue(k).trim();
 const surface=color('--surface')||'#fff',text=color('--text')||'#27332f',muted=color('--muted')||'#68736c',line=color('--line')||'#e4e8e2',accent=color('--accent')||'#167f8d';
 const fill=(c,x,y,a,b)=>{ctx.fillStyle=c;ctx.fillRect(x,y,a,b);};
 const rule=(x,y,x2,y2,c=line)=>{ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();};
 const label=(s,x,y,c=text,size=13,weight=500)=>{ctx.fillStyle=c;ctx.font=font(size,weight);ctx.fillText(s,x,y);};
 const rounded=(x,y,a,b,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,a,b,r);ctx.fill();};
 const fit=(s,width)=>{ctx.font=font();if(ctx.measureText(s).width<=width)return s;while(s.length&&ctx.measureText(s+'…').width>width)s=s.slice(0,-1);return s+'…';};
 fill(surface,0,0,w,h);
 label(project.name||'專案',20,31,text,22,600);
 const end=sorted.reduce((s,t)=>t.end>s?t.end:s,sorted[0].end);
 label(`${sorted[0].start} — ${end}  ·  ${sorted.length} 項工項  ·  匯出 ${today()}`,20,57,muted,11,400);
 label(`工項  ${sorted.length}`,16,top+23);label('工期 / 完成度',16,top+40,muted,9,400);
 const body=top+head,step=dateStep(dw);let monthStart=0;
 for(let i=0;i<days;i++){
  const d=addDays(start,i),date=dateOf(d),x=side+i*dw;
  if([0,6].includes(date.getDay()))fill(color('--weekend')||(options.dark?'#ffffff04':'#f8faf9'),x,body,dw,row*sorted.length);
  if(date.getDay()===1)rule(x,body,x,h-32);
  if(d===today())fill(color('--accent-soft')||'#e7f5f5',x,top+GANTT.month,dw,head-GANTT.month);
  if(i%step===0||d===today()){
   ctx.textAlign='center';label(String(date.getDate()),x+dw/2,top+35,d===today()?accent:muted,11,500);
   if(dw>=14)label('日一二三四五六'[date.getDay()],x+dw/2,top+48,d===today()?accent:muted,9,400);ctx.textAlign='left';
  }
  if(i===days-1||addDays(start,i+1).slice(0,7)!==d.slice(0,7)){
   const mx=side+monthStart*dw,mw=(i-monthStart+1)*dw;ctx.save();ctx.beginPath();ctx.rect(mx,top,mw,GANTT.month);ctx.clip();label(`${date.getFullYear()} 年 ${date.getMonth()+1} 月`,mx+10,top+16,text,11,600);ctx.restore();rule(mx,top,mx,top+GANTT.month);monthStart=i+1;
  }
 }
 rule(side,top+GANTT.month,w,top+GANTT.month);rule(0,body,w,body);rule(side,top,side,h-32);
 const ti=diffDays(start,today());if(ti>=0&&ti<days)rule(side+(ti+.5)*dw,body,side+(ti+.5)*dw,h-32,accent+'66');
 const cats=categories(project);
 sorted.forEach((t,i)=>{
  const y=body+i*row,c=cats.find(c=>c.key===t.category)?.color||'#808A9B',x=side+diffDays(start,t.start)*dw,bw=Math.max(4,(diffDays(t.start,t.end)+1)*dw),by=y+GANTT.barTop;
  rule(0,y+row,w,y+row);rounded(16,y+12,3,25,1.5,c);label(fit(t.name,side-49),30,y+19,text,13,500);label(`${duration(t,project.calendar)} 天  ·  ${t.progress||0}%`,30,y+36,muted,10,400);
  rounded(x,by,bw,GANTT.barHeight,GANTT.radius,c);
  if(t.progress){ctx.save();ctx.beginPath();ctx.roundRect(x,by,bw,GANTT.barHeight,GANTT.radius);ctx.clip();ctx.globalAlpha=.35;fill(textOn(c),x,by+GANTT.barHeight-3,bw*Math.min(100,Math.max(0,t.progress))/100,3);ctx.restore();}
  // Identical type size on both backgrounds; never squeeze text to bar width.
  for(const inside of [true,false]){ctx.save();ctx.beginPath();ctx.rect(inside?x:x+bw,y,inside?bw:w-x-bw,row);ctx.clip();label(t.name,x+GANTT.padding,by+18,inside?textOn(c):text,GANTT.fontSize,GANTT.fontWeight);ctx.restore();}
 });
 label('ZenFlow · 工期規劃',16,h-12,muted,10,400);
 return {filename:(project.name||'專案').replace(/[<>:"/\\|?*]/g,'_')+'-工期表.jpg',url:cv.toDataURL('image/jpeg',.95),width:cv.width,height:cv.height};
}
