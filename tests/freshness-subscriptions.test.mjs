import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspace, createOrder } from '../lib/domain.ts';
import { allocateStock, availableStock, batchPrice, canSubscribe, displayPrice, indiaDate, validDate, lineTotal } from '../lib/inventory.ts';
import { matchesProduct } from '../lib/search.ts';
import { nextOccurrence, previewSubscription, saveSubscription } from '../lib/subscriptions.ts';
const now=Date.parse('2026-10-18T10:00:00+05:30');
const request=()=>({lines:[{productId:'gupta-2',quantity:4}],location:{lat:28.4116,lng:77.346},address:'Sample home in Sector 88',payment:'upi',requestId:crypto.randomUUID()});
function datedState(){const state=initialWorkspace();const p=state.products.find(p=>p.id==='gupta-2');p.stock=10;p.batches=[{id:'newer',bestBefore:'2026-10-25',quantity:5,saleLeadDays:2},{id:'older',bestBefore:'2026-10-19',quantity:2,salePrice:2000,saleLeadDays:2},{id:'past',bestBefore:'2026-10-17',quantity:3,salePrice:1000,saleLeadDays:2}];return state;}
function subInput(overrides={}){return {productId:'gupta-2',quantity:1,frequency:'daily',days:[],startDate:'2026-10-18',time:'07:00',address:'Sample home in Sector 88',location:{lat:28.4116,lng:77.346},...overrides};}

test('best-before dates use Indian midnight and validate real calendar dates',()=>{
 assert.equal(indiaDate(Date.parse('2026-10-18T18:29:59Z')),'2026-10-18');
 assert.equal(indiaDate(Date.parse('2026-10-18T18:30:00Z')),'2026-10-19');
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('19/10/2026'),false);
});
test('FEFO sells oldest available batches, discounts only those batches, and excludes past dates',()=>{
 const state=datedState(),p=state.products.find(p=>p.id==='gupta-2');
 assert.equal(availableStock(p,now),7);assert.equal(displayPrice(p,now),2000);
 const quote=allocateStock(p,4,now);assert.deepEqual(quote.allocations.map(a=>[a.batchId,a.quantity,a.price]),[['older',2,2000],['newer',2,2900]]);
 assert.equal(quote.total,9800);assert.equal(lineTotal(p,4,now),9800);
 const result=createOrder(state,request(),now);const changed=result.state.products.find(p=>p.id==='gupta-2');
 assert.equal(changed.batches.find(b=>b.id==='older').quantity,0);assert.equal(changed.batches.find(b=>b.id==='newer').quantity,3);assert.equal(changed.batches.find(b=>b.id==='past').quantity,3);
 assert.equal(result.order.total,11700);assert.deepEqual(result.order.deliveries[0].items.map(i=>i.bestBefore),['2026-10-19','2026-10-25']);
});
test('a batch sale activates only inside its configured window',()=>{
 const p=datedState().products.find(p=>p.id==='gupta-2'),batch={id:'sale',bestBefore:'2026-10-25',quantity:2,salePrice:2000,saleLeadDays:2};
 assert.equal(batchPrice(p,batch,now),2900);
 assert.equal(batchPrice(p,batch,Date.parse('2026-10-23T07:00:00+05:30')),2000);
 assert.equal(batchPrice(p,batch,Date.parse('2026-10-25T23:59:00+05:30')),2000);
});
test('no-date legacy inventory remains usable and insufficient date-valid stock fails atomically',()=>{
 const state=datedState(),before=JSON.stringify(state);
 assert.throws(()=>createOrder(state,{...request(),lines:[{productId:'gupta-2',quantity:8}]},now),/Only 7/);assert.equal(JSON.stringify(state),before);
 const legacy=initialWorkspace().products[0];assert.equal(availableStock(legacy,now),legacy.stock);assert.equal(lineTotal(legacy,2,now),legacy.price*2);
});
test('search recognises equivalent names, Hindi, partial names and merchant aliases',()=>{
 const atta=initialWorkspace().products.find(p=>p.id==='sharma-5');
 for(const term of ['atta','ata','AATA','flour','आटा','chakki flour','att'])assert.equal(matchesProduct(atta,term),true,term);
 assert.equal(matchesProduct(atta,'milk'),false);
 assert.equal(matchesProduct({...atta,aliases:['wholemeal flour','gehun']},'wholemeal flour'),true);
 const milk=initialWorkspace().products.find(p=>p.id==='gupta-2');assert.equal(matchesProduct(milk,'doodh'),true);assert.equal(matchesProduct(milk,'दूध'),true);
 assert.equal(matchesProduct(atta,'Sharma','Sharma General Store'),true);
});
test('daily schedules use the next IST slot without backdating',()=>{
 const state=saveSubscription(initialWorkspace(),subInput(),now),s=state.subscriptions[0];
 const next=nextOccurrence(s,now);assert.equal(next.date,'2026-10-19');assert.equal(new Date(next.at).toISOString(),'2026-10-19T01:30:00.000Z');
});
test('alternate-day and selected-weekday schedules keep their original cadence',()=>{
 const alternate=saveSubscription(initialWorkspace(),subInput({frequency:'alternate'}),now).subscriptions[0];assert.equal(nextOccurrence(alternate,now).date,'2026-10-20');
 const weekly=saveSubscription(initialWorkspace(),subInput({frequency:'weekly',days:[2,4]}),now).subscriptions[0];assert.equal(nextOccurrence(weekly,now).date,'2026-10-20');
 assert.equal(nextOccurrence({...weekly,status:'paused'},now),null);
 assert.equal(nextOccurrence({...weekly,status:'cancelled'},now),null);
});
test('subscriptions validate days, locations, eligibility and quantities',()=>{
 for(const patch of [{frequency:'weekly',days:[]},{quantity:0},{time:'25:00'},{startDate:'2026-02-30'},{location:{lat:0,lng:0}},{productId:'sharma-0'}])assert.throws(()=>saveSubscription(initialWorkspace(),subInput(patch),now));
 assert.equal(canSubscribe(initialWorkspace().products.find(p=>p.id==='gupta-2')),true);
});
test('a subscription occurrence is created once, uses delivery-date-valid stock and advances the schedule',()=>{
 let state=saveSubscription(datedState(),subInput({quantity:3}),now);const sub=state.subscriptions[0];const result=previewSubscription(state,sub.id,'2026-10-19',now);
 assert.equal(result.order.subscriptionId,sub.id);assert.equal(result.order.scheduledFor,Date.parse('2026-10-19T07:00:00+05:30'));
 assert.equal(result.order.total,8800);assert.equal(nextOccurrence(result.state.subscriptions[0],now).date,'2026-10-20');
 const again=previewSubscription(result.state,sub.id,'2026-10-19',now);assert.equal(again.order.id,result.order.id);assert.equal(again.state.orders.length,1);
 state=saveSubscription(datedState(),subInput({startDate:'2026-10-26'}),now);
 assert.throws(()=>previewSubscription(state,state.subscriptions[0].id,'2026-10-26',now),/Only 0/);
});
test('editing a schedule preserves fulfilment history and cancelled plans cannot be revived by editing',()=>{
 const state=saveSubscription(initialWorkspace(),subInput(),now);const sub=state.subscriptions[0];sub.lastGeneratedDate='2026-10-19';
 const updated=saveSubscription(state,{...sub,time:'08:00'},now);assert.equal(updated.subscriptions[0].lastGeneratedDate,'2026-10-19');assert.equal(nextOccurrence(updated.subscriptions[0],now).date,'2026-10-20');
 state.subscriptions[0].status='cancelled';assert.throws(()=>saveSubscription(state,{...sub,time:'08:00'},now),/cancelled/);
});

test('ordinary checkout holds stock that would pass best-before before arrival',()=>{
 const state=datedState();const p=state.products.find(p=>p.id==='gupta-2');p.batches=[{id:'midnight',bestBefore:'2026-10-18',quantity:4,saleLeadDays:0}];p.stock=4;
 assert.throws(()=>createOrder(state,request(),Date.parse('2026-10-18T23:55:00+05:30')),/Only 0/);
});
