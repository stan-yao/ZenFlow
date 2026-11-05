import {addDays,diffDays,validDate} from './core.mjs';
// Shared by the interactive timeline and JPG renderer; logical pixels before 2x export.
export const GANTT={row:46,header:52,month:23,barHeight:26,barTop:10,radius:5,padding:10,fontSize:13,fontWeight:500,fontFamily:'Inter, "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif'};
export const dateStep=dw=>Math.max(1,Math.ceil(24/dw));
export function rangeFor(tasks,fallback){const valid=tasks.filter(t=>validDate(t.start)&&validDate(t.end)&&t.end>=t.start);const first=valid.length?valid.reduce((s,t)=>t.start<s?t.start:s,valid[0].start):fallback;const last=valid.length?valid.reduce((s,t)=>t.end>s?t.end:s,valid[0].end):addDays(fallback,30);const start=addDays(first,-3);return {start,total:Math.max(21,diffDays(start,last)+8),sorted:[...valid].sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id))};}
