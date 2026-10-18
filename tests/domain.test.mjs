import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspace, createOrder, nearbyStores, distanceKm, deliveryFee, deliveryStatus, remainingTime, SAMPLE_LOCATION, isPoint } from '../lib/domain.ts';

const request = (overrides={}) => ({lines:[{productId:'sharma-0',quantity:2},{productId:'hariom-1',quantity:1}],location:SAMPLE_LOCATION,address:'Demo home, Sector 88, Faridabad',payment:'upi',requestId:crypto.randomUUID(),...overrides});

test('discovery includes only stores within one kilometre and sorts by distance',()=>{
  const stores=nearbyStores(initialWorkspace().stores,SAMPLE_LOCATION);
  assert.equal(stores.length,4);
  assert.ok(!stores.some(s=>s.id==='greenbasket'));
  assert.ok(stores.every(s=>s.distance<=1));
  assert.ok(stores.every((s,i)=>i===0||s.distance>=stores[i-1].distance));
  assert.equal(distanceKm(SAMPLE_LOCATION,SAMPLE_LOCATION),0);
});

test('one checkout produces independent deliveries and computes totals on the server',()=>{
  const state=initialWorkspace(); const input=request(); const now=1000000;
  const result=createOrder(state,input,now);
  assert.equal(result.order.deliveries.length,2);
  assert.equal(result.order.total,14200);
  assert.deepEqual(result.order.deliveries.map(d=>d.mode),['store','platform']);
  assert.deepEqual(result.order.deliveries.map(d=>d.etaAt),[now+18*60000,now+15*60000]);
  assert.equal(result.state.products.find(p=>p.id==='sharma-0').stock,30);
  assert.equal(state.products.find(p=>p.id==='sharma-0').stock,32,'input is not mutated');
});

test('idempotent retry returns the same order without reducing stock again',()=>{
  const input=request(); const first=createOrder(initialWorkspace(),input);
  const retry=createOrder(first.state,input);
  assert.equal(retry.order.id,first.order.id);
  assert.equal(retry.state.orders.length,1);
  assert.equal(retry.state.products.find(p=>p.id==='sharma-0').stock,30);
});

test('a stock failure is atomic across every store',()=>{
  const state=initialWorkspace();const before=JSON.stringify(state);
  assert.throws(()=>createOrder(state,request({lines:[{productId:'sharma-0',quantity:2},{productId:'hariom-1',quantity:99}]})),/Only/);
  assert.equal(JSON.stringify(state),before);
});

test('duplicate cart lines cannot bypass stock limits',()=>{
  assert.throws(()=>createOrder(initialWorkspace(),request({lines:[{productId:'sharma-0',quantity:20},{productId:'sharma-0',quantity:20}]})),/Only 32/);
});

test('checkout rejects closed and out-of-radius stores',()=>{
  const state=initialWorkspace();state.stores[0].open=false;
  assert.throws(()=>createOrder(state,request()),/currently closed/);
  assert.throws(()=>createOrder(initialWorkspace(),request({lines:[{productId:'greenbasket-0',quantity:1}]})),/outside your 1 km/);
});

test('checkout rejects invalid coordinates, quantities, empty baskets and addresses',()=>{
  for(const quantity of [0,-1,1.5,100,NaN])assert.throws(()=>createOrder(initialWorkspace(),request({lines:[{productId:'sharma-0',quantity}]})),/Quantities/);
  assert.throws(()=>createOrder(initialWorkspace(),request({location:{lat:91,lng:0}})),/location/);
  assert.throws(()=>createOrder(initialWorkspace(),request({lines:[]})),/basket/);
  assert.throws(()=>createOrder(initialWorkspace(),request({address:'short'})),/address/);
  assert.equal(isPoint({lat:Infinity,lng:0}),false);
});

test('free delivery is calculated per store, not across a basket',()=>{
  assert.equal(deliveryFee(29899),1900);assert.equal(deliveryFee(29900),0);
  const result=createOrder(initialWorkspace(),request({lines:[{productId:'sharma-5',quantity:2},{productId:'hariom-1',quantity:1}]}));
  assert.deepEqual(result.order.deliveries.map(d=>d.fee),[0,1900]);
  assert.equal(result.order.total,54500);
});

test('delivery progression uses each ETA and manual progress never moves backwards',()=>{
  const {order}=createOrder(initialWorkspace(),request(),1000000);
  const d=order.deliveries[0];
  assert.equal(deliveryStatus(order,d,1000000),0);
  assert.equal(deliveryStatus(order,d,1000000+3*60000),1);
  assert.equal(deliveryStatus(order,d,1000000+10*60000),2);
  assert.equal(deliveryStatus(order,d,d.etaAt),3);
  d.status=2;assert.equal(deliveryStatus(order,d,1000000),2);
  assert.equal(remainingTime(d.etaAt,1000000),'18:00');
  assert.equal(remainingTime(d.etaAt,d.etaAt+10000),'00:00');
});
