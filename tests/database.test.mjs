import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key,phone text,phone_confirmed_at timestamptz);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
await db.exec(await readFile(new URL('../supabase/migrations/001_marketplace.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/003_sample_catalog.sql',import.meta.url),'utf8'));
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',buyer='33333333-3333-4333-8333-333333333333';
await db.query(`insert into auth.users values($1,'+919876543210',now()),($2,'+919876543211',now()),($3,'+919876543212',now())`,[owner,other,buyer]);
const as=async(id,role='authenticated')=>{await db.exec(`set role ${role}`);await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[id||'']);};
const admin=()=>db.exec('reset role');
let store,product,batchOld,batchNew,order;
const data={name:'Chakki atta',unit:'1 kg',category:'staples',price:10000,mrp:12000,aliases:['flour','ata'],subscription_enabled:true,reorder_level:10,unit_cost:6000};

test('owners can create stores and only manage their own products',async()=>{
 await as(owner);store=(await db.query(`insert into public.stores(owner_id,name,address,business_phone,lat,lng,is_open)values($1,'My Kirana','Sector 88, Faridabad','+919876543210',28.4116,77.346,true)returning id`,[owner])).rows[0].id;
 product=(await db.query(`select public.save_product($1,$2) as id`,[store,JSON.stringify(data)])).rows[0].id;
 await as(other);await assert.rejects(()=>db.query(`select public.save_product($1,$2)`,[store,JSON.stringify({...data,id:product})]),/access denied/);
 await assert.rejects(()=>db.query(`update public.products set price=1 where id=$1`,[product]),/permission denied/);
});
test('inventory receipts and mixed-batch FEFO sale allocations are transactional',async()=>{
 await as(owner);batchOld=(await db.query(`select public.receive_stock($1,2,public.india_today()+1,'Older')id`,[product])).rows[0].id;batchNew=(await db.query(`select public.receive_stock($1,10,public.india_today()+20,'Newer')id`,[product])).rows[0].id;
 await db.query(`select public.adjust_batch($1,0,'',8000,3)`,[batchOld]);await as(buyer);
 const placed=(await db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')o`,[crypto.randomUUID(),JSON.stringify([{productId:product,quantity:3}])])).rows[0].o;order=placed.id;
 assert.equal(placed.total,27900);const items=(await db.query('select * from public.order_items')).rows;assert.deepEqual(items.map(i=>[i.quantity,i.unit_price]).sort((a,b)=>a[1]-b[1]),[[2,8000],[1,10000]]);
 await assert.rejects(()=>db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')`,[crypto.randomUUID(),JSON.stringify([{productId:product,quantity:99}])]),/Insufficient/);
 assert.equal((await db.query(`select units from public.inventory_batches where id=$1`,[batchNew])).rows[0].units,9);
});
test('customers cannot edit payment state, read merchant costs or another customer orders',async()=>{
 await as(other);assert.equal((await db.query('select * from public.orders')).rows.length,0);assert.equal((await db.query('select * from public.product_costs')).rows.length,0);
 await assert.rejects(()=>db.query(`update public.orders set payment_status='paid'where id=$1`,[order]),/permission denied/);
 await assert.rejects(()=>db.query(`select public.confirm_payment('x','y',1,'event')`),/permission denied/);
 await as(owner);assert.equal((await db.query('select * from public.orders')).rows.length,0);assert.equal((await db.query('select * from public.store_orders')).rows.length,1);
});
test('only the store owner can advance real fulfilment and COD completion needs collection',async()=>{
 await as(owner);const id=(await db.query('select id from public.store_orders')).rows[0].id;
 await db.query(`select public.progress_delivery($1,'packing')`,[id]);await db.query(`select public.progress_delivery($1,'out_for_delivery')`,[id]);
 await assert.rejects(()=>db.query(`select public.progress_delivery($1,'delivered')`,[id]),/cash collection/);
 await db.query(`select public.progress_delivery($1,'delivered',null,true)`,[id]);await as(buyer);assert.equal((await db.query('select payment_status from public.orders')).rows[0].payment_status,'collected');
});
test('checkout retries are idempotent and pending reservation expiry restores stock once',async()=>{
 await admin();await db.exec('update public.marketplace_settings set allow_online=true');await as(buyer);const key=crypto.randomUUID(),cart=JSON.stringify([{productId:product,quantity:1}]);
 const a=(await db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'online')o`,[key,cart])).rows[0].o;
 const b=(await db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'online')o`,[key,cart])).rows[0].o;assert.equal(a.id,b.id);
 await admin();await db.query(`update public.orders set expires_at=now()-interval '1 minute'where id=$1`,[a.id]);await db.exec('select public.expire_unpaid_orders()');await db.exec('select public.expire_unpaid_orders()');assert.equal((await db.query(`select units from public.inventory_batches where id=$1`,[batchNew])).rows[0].units,9);
});
test('invalid payments never mark an order paid and late captures require refund',async()=>{
 await admin();const id=(await db.query(`select id from public.orders where payment_method='online'`)).rows[0].id;
 await db.query(`update public.orders set razorpay_order_id='order_live'where id=$1`,[id]);
 await assert.rejects(()=>db.query(`select public.confirm_payment('order_live','pay_live',1,'event_bad')`),/amount mismatch/);
 assert.equal((await db.query(`select public.confirm_payment('order_live','pay_live',11900,'event_late')s`)).rows[0].s,'refund_required');
});
test('subscriptions enforce ownership and materialise real COD occurrences once',async()=>{
 await as(buyer);const info={product_id:product,quantity:1,frequency:'daily',weekdays:[],start_date:new Date(Date.now()+19800000).toISOString().slice(0,10),delivery_time:'07:00',address:'Customer home, Sector 88',lat:28.4116,lng:77.346};
 const id=(await db.query(`select public.save_subscription(null,$1)id`,[JSON.stringify(info)])).rows[0].id;
 await as(other);await assert.rejects(()=>db.query(`select public.set_subscription_status($1,'cancelled')`,[id]),/access denied/);
 await admin();const before=Number((await db.query('select count(*)n from public.orders')).rows[0].n);await db.exec('select public.run_subscriptions()');await db.exec('select public.run_subscriptions()');assert.equal(Number((await db.query('select count(*)n from public.orders')).rows[0].n),before+1);
});
test.after(async()=>{await db.close();});

test('unverified phones, out-of-radius delivery and stale batches cannot create orders',async()=>{
 await admin();const unknown='44444444-4444-4444-8444-444444444444';await db.query(`insert into auth.users values($1,'+919876543213',null)`,[unknown]);await as(unknown);
 await assert.rejects(()=>db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')`,[crypto.randomUUID(),JSON.stringify([{productId:product,quantity:1}])]),/verified phone/);
 await as(buyer);await assert.rejects(()=>db.query(`select public.place_order($1,$2,'Far away address',0,0,'cod')`,[crypto.randomUUID(),JSON.stringify([{productId:product,quantity:1}])]),/outside/);
 await as(owner);const stale=(await db.query(`select public.save_product($1,$2)id`,[store,JSON.stringify({...data,name:'Dated milk',category:'dairy'})])).rows[0].id;await db.query(`select public.receive_stock($1,5,public.india_today()-1,'Past')`,[stale]);await as(buyer);
 await assert.rejects(()=>db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')`,[crypto.randomUUID(),JSON.stringify([{productId:stale,quantity:1}])]),/Insufficient/);
});
test('anonymous users cannot execute writes or view customer and merchant private records',async()=>{
 await as(null,'anon');await assert.rejects(()=>db.query('select * from public.orders'),/permission denied/);await assert.rejects(()=>db.query('select * from public.product_costs'),/permission denied/);await assert.rejects(()=>db.query(`select public.receive_stock($1,1,null,'')`,[product]),/permission denied/);
});
test('subscription cadence is anchored to the start date and uses IST slots',async()=>{
 await admin();const alt=(await db.query(`select public.next_subscription_at('2026-10-18','alternate','{}','07:00','2026-10-18 10:00+05:30')n`)).rows[0].n;assert.equal(new Date(alt).toISOString(),'2026-10-20T01:30:00.000Z');const week=(await db.query(`select public.next_subscription_at('2026-10-18','weekly','{2,4}','07:00','2026-10-18 10:00+05:30')n`)).rows[0].n;assert.equal(new Date(week).toISOString(),'2026-10-20T01:30:00.000Z');
});

test('multiple stores share one checkout while ownership and fees stay separate',async()=>{
 await as(other);const second=(await db.query(`insert into public.stores(owner_id,name,address,business_phone,lat,lng,is_open)values($1,'Second Kirana','Sector 88, Faridabad','+919876543211',28.412,77.346,true)returning id`,[other])).rows[0].id;
 const item=(await db.query(`select public.save_product($1,$2)id`,[second,JSON.stringify({...data,name:'Rice'})])).rows[0].id;await db.query(`select public.receive_stock($1,5,public.india_today()+10,'Opening')`,[item]);
 await as(buyer);const result=(await db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')o`,[crypto.randomUUID(),JSON.stringify([{productId:product,quantity:1},{productId:item,quantity:1}])])).rows[0].o;
 assert.equal(result.total,23800);const children=(await db.query(`select * from public.store_orders where order_id=$1`,[result.id])).rows;assert.equal(children.length,2);
 await as(other);assert.equal((await db.query(`select * from public.store_orders where order_id=$1`,[result.id])).rows.length,1);
 const delivery=children.find(d=>d.store_id===second);await db.query(`select public.cancel_cod_delivery($1,'Customer requested cancellation')`,[delivery.id]);await assert.rejects(()=>db.query(`select public.cancel_cod_delivery($1,'Repeated cancellation')`,[delivery.id]),/cancelled here/);
 await as(buyer);assert.equal((await db.query(`select total from public.orders where id=$1`,[result.id])).rows[0].total,11900);
});
test('malformed quantities cannot drain batches or create partial orders',async()=>{
 await as(buyer);await assert.rejects(()=>db.query(`select public.place_order($1,$2,'Customer home, Sector 88',28.4116,77.346,'cod')`,[crypto.randomUUID(),JSON.stringify([{productId:product}])]),/quantity/);
});

test('shop owners can add and safely remove the 24-product starter catalogue',async()=>{
 await as(owner);assert.equal((await db.query(`select public.seed_sample_catalog($1)n`,[store])).rows[0].n,24);
 const rows=(await db.query(`select count(*)n,min(image_index)lo,max(image_index)hi from public.products where store_id=$1 and sample_data`,[store])).rows[0];assert.equal(Number(rows.n),24);assert.equal(rows.lo,0);assert.equal(rows.hi,23);
 await assert.rejects(()=>db.query(`select public.seed_sample_catalog($1)`,[store]),/already has/);
 await as(other);await assert.rejects(()=>db.query(`select public.remove_sample_catalog($1)`,[store]),/access denied/);
 await as(owner);await db.query(`select public.remove_sample_catalog($1)`,[store]);assert.equal(Number((await db.query(`select count(*)n from public.products where store_id=$1 and sample_data and active`,[store])).rows[0].n),0);
});
