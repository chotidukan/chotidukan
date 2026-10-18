import type { Product } from './domain.ts';
export type Batch = { id:string; bestBefore:string; quantity:number; salePrice?:number; saleLeadDays:number };
export const indiaDate = (now=Date.now()) => new Date(now+19800000).toISOString().slice(0,10);
export function validDate(value:unknown):value is string { return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value; }
export const daysUntil=(date:string,now=Date.now())=>Math.round((Date.parse(date)-Date.parse(indiaDate(now)))/86400000);
export function sellableBatches(p:Product,now=Date.now()) { return (p.batches||[]).filter(b=>b.quantity>0&&b.bestBefore>=indiaDate(now)).sort((a,b)=>a.bestBefore.localeCompare(b.bestBefore)||a.id.localeCompare(b.id)); }
export function availableStock(p:Product,now=Date.now()) { return p.batches ? sellableBatches(p,now).reduce((n,b)=>n+b.quantity,0):p.stock; }
export function batchPrice(p:Product,b:Batch,now=Date.now()) {return b.salePrice!==undefined&&daysUntil(b.bestBefore,now)>=0&&daysUntil(b.bestBefore,now)<=b.saleLeadDays?b.salePrice:p.price;}
export function firstBestBefore(p:Product,now=Date.now()) {return sellableBatches(p,now)[0]?.bestBefore||null;}
export function displayPrice(p:Product,now=Date.now()) {const b=sellableBatches(p,now)[0];return b?batchPrice(p,b,now):p.price;}
export function onDateSale(p:Product,now=Date.now()) {return availableStock(p,now)>0&&displayPrice(p,now)<p.price;}
export function allocateStock(p:Product,quantity:number,now=Date.now()) {
  const allocations:{batchId?:string;bestBefore?:string;quantity:number;price:number}[]=[];let left=quantity;
  if(!p.batches){const count=Math.min(left,p.stock);if(count>0)allocations.push({quantity:count,price:p.price});left-=count;}
  else for(const batch of sellableBatches(p,now)){if(!left)break;const count=Math.min(left,batch.quantity);allocations.push({batchId:batch.id,bestBefore:batch.bestBefore,quantity:count,price:batchPrice(p,batch,now)});left-=count;}
  return {allocations,shortage:left,total:allocations.reduce((n,a)=>n+a.quantity*a.price,0)};
}
export function lineTotal(p:Product,quantity:number,now=Date.now()){const q=allocateStock(p,quantity,now);return q.total+q.shortage*p.price;}
export function formatDate(date:string){return new Date(date+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}
export const canSubscribe=(p:Product)=>p.subscriptionEligible??['dairy','staples','breakfast','beverages'].includes(p.category);
