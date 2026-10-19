import type {Product,Point} from './types';
export const money=(p:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(p/100);
export const indiaDate=(at=Date.now())=>new Date(at+19800000).toISOString().slice(0,10);
export const dayDifference=(date:string,at=Date.now())=>Math.round((Date.parse(date)-Date.parse(indiaDate(at)))/86400000);
export function km(a:Point,b:Point){const r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));}
export const validPoint=(x:unknown):x is Point=>!!x&&typeof x==='object'&&Number.isFinite((x as Point).lat)&&Number.isFinite((x as Point).lng)&&Math.abs((x as Point).lat)<=90&&Math.abs((x as Point).lng)<=180;
export const batches=(p:Product,at=Date.now())=>(p.inventory_batches||[]).filter(b=>b.units>0&&(!b.best_before||b.best_before>=indiaDate(at))).sort((a,b)=>(a.best_before||'9999').localeCompare(b.best_before||'9999')||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export const available=(p:Product,at=Date.now())=>batches(p,at).reduce((n,b)=>n+b.units,0);
export function quote(p:Product,quantity:number,at=Date.now()){let left=quantity,total=0;const picks:{batchId:string;quantity:number;price:number;date:string|null}[]=[];for(const b of batches(p,at)){const take=Math.min(left,b.units),price=b.sale_price!==null&&b.sale_price<p.price&&b.best_before&&dayDifference(b.best_before,at)<=b.sale_lead_days?b.sale_price:p.price;if(take){picks.push({batchId:b.id,quantity:take,price,date:b.best_before});total+=take*price;left-=take;}if(!left)break;}return {total,picks,shortage:left};}
export const firstPrice=(p:Product,at=Date.now())=>quote(p,1,at).picks[0]?.price??p.price;
export const prettyDate=(date:string)=>new Date(date.length===10?date+'T12:00:00+05:30':date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
export const timeLabel=(date:string)=>new Date(date).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'});
export function countdown(date:string,now:number){const secs=Math.max(0,Math.ceil((Date.parse(date)-now)/1000));if(!secs)return 'Estimate passed';if(secs>=86400)return `${Math.floor(secs/86400)}d ${Math.floor(secs/3600)%24}h`;return `${Math.floor(secs/3600)?Math.floor(secs/3600)+':':''}${String(Math.floor(secs/60)%60).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;}
export function csv(rows:unknown[][]){return rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
