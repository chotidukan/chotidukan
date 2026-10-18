import { createOrder, DomainError, distanceKm, isPoint, type Point, type Workspace } from './domain.ts';
import { canSubscribe, indiaDate, validDate } from './inventory.ts';
export type Subscription={id:string;productId:string;quantity:number;frequency:'daily'|'alternate'|'weekly';days:number[];startDate:string;time:string;address:string;location:Point;status:'active'|'paused'|'cancelled';createdAt:number;lastGeneratedDate?:string};
export const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const TIME_SLOTS=['06:00','07:00','08:00','09:00','12:00','17:00','18:00','19:00'];
export function nextOccurrence(s:Subscription,now=Date.now()):{date:string;at:number}|null {
  if(s.status!=='active')return null;
  const start=Date.parse(s.startDate+'T00:00:00Z');
  const today=Date.parse(indiaDate(now)+'T00:00:00Z');
  for(let i=0;i<370;i++){
    const day=Math.max(start,today)+i*86400000;const date=new Date(day).toISOString().slice(0,10);
    if(s.lastGeneratedDate&&date<=s.lastGeneratedDate)continue;
    const at=Date.parse(date+'T'+s.time+':00+05:30');if(at<=now)continue;
    if(s.frequency==='alternate'&&Math.round((day-start)/86400000)%2!==0)continue;
    if(s.frequency==='weekly'&&!s.days.includes(new Date(day).getUTCDay()))continue;
    return {date,at};
  }return null;
}
export function scheduleLabel(s:Subscription){return s.frequency==='daily'?'Every day':s.frequency==='alternate'?'Every other day':s.days.map(d=>WEEKDAYS[d]).join(', ');}
export function slotLabel(time:string){const h=Number(time.slice(0,2));const fmt=(n:number)=>`${n%12||12}:00 ${n<12?'AM':'PM'}`;return `${fmt(h)}–${fmt(h+1)} IST`;}
export function saveSubscription(state:Workspace,input:unknown,now=Date.now()):Workspace {
  const v=input as Subscription;
  if(!v||typeof v!=='object')throw new DomainError('Add a valid subscription.');
  const p=state.products.find(p=>p.id===v.productId);const store=state.stores.find(s=>s.id===p?.storeId);
  if(!p||!store||!canSubscribe(p))throw new DomainError('This product is not available for subscription.');
  if(!store.open)throw new DomainError('This store is currently closed.');
  if(!isPoint(v.location)||distanceKm(v.location,store)>1)throw new DomainError('The subscription address must be within 1 km of the store.');
  if(!Number.isInteger(v.quantity)||v.quantity<1||v.quantity>99)throw new DomainError('Choose a quantity from 1 to 99.');
  if(!['daily','alternate','weekly'].includes(v.frequency)||!Array.isArray(v.days)||v.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw new DomainError('Choose valid delivery days.');
  if(v.frequency==='weekly'&&!v.days.length)throw new DomainError('Choose at least one weekday.');
  if(!validDate(v.startDate)||!TIME_SLOTS.includes(v.time))throw new DomainError('Choose a valid start date and delivery time.');
  if(typeof v.address!=='string'||v.address.trim().length<8||v.address.length>250)throw new DomainError('Add an address of 8–250 characters.');
  const next=structuredClone(state);next.subscriptions ||= [];
  const previous=v.id?next.subscriptions.find(s=>s.id===v.id):null;
  if(v.id&&!previous)throw new DomainError('Subscription not found.');
  if(previous?.status==='cancelled')throw new DomainError('A cancelled subscription cannot be edited. Create a new one.');
  if(!previous&&v.startDate<indiaDate(now))throw new DomainError('Choose today or a future start date.');
  if(previous&&previous.productId!==v.productId)throw new DomainError('Create a new subscription to change the product.');
  const s:Subscription={id:previous?.id||crypto.randomUUID(),productId:p.id,quantity:v.quantity,frequency:v.frequency,days:[...new Set(v.days)].sort(),startDate:v.startDate,time:v.time,address:v.address.trim(),location:v.location,status:previous?.status||'active',createdAt:previous?.createdAt||now,lastGeneratedDate:previous?.lastGeneratedDate};
  if(!nextOccurrence({...s,status:'active'},now))throw new DomainError('This schedule has no upcoming delivery.');
  if(previous)next.subscriptions=next.subscriptions.map(x=>x.id===s.id?s:x);else next.subscriptions.push(s);
  return next;
}
export function previewSubscription(state:Workspace,id:string,occurrenceDate:string,now=Date.now()) {
  const sub=state.subscriptions?.find(s=>s.id===id);
  if(!sub||sub.status!=='active')throw new DomainError('Activate the subscription before creating a demo delivery.');
  const key=`sub-${id}-${occurrenceDate}`;const existing=state.orders.find(o=>o.requestId===key);if(existing)return {state,order:existing};
  const occurrence=nextOccurrence(sub,now);
  if(!occurrence||occurrence.date!==occurrenceDate)throw new DomainError('The next delivery changed. Refresh and try again.');
  const product=state.products.find(p=>p.id===sub.productId);
  if(!product||!canSubscribe(product))throw new DomainError('This product no longer supports subscriptions.');
  const result=createOrder(state,{lines:[{productId:sub.productId,quantity:sub.quantity}],location:sub.location,address:sub.address,payment:'upi',requestId:key},now,occurrence.at);
  result.order.subscriptionId=id;result.order.scheduledFor=occurrence.at;
  result.order.deliveries.forEach(d=>{d.etaAt=occurrence.at;});
  result.state.subscriptions!.find(s=>s.id===id)!.lastGeneratedDate=occurrence.date;
  return result;
}
