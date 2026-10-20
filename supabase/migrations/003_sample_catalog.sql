begin;

alter table public.products add column if not exists sample_data boolean not null default false;
alter table public.products drop constraint if exists products_image_index_check;
alter table public.products add constraint products_image_index_check check(image_index between 0 and 23);

create or replace function public.seed_sample_catalog(p_store uuid) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  r record;
  v_product uuid;
  v_batch uuid;
  v_count integer := 0;
  v_date date;
begin
  if not public.owns_store(p_store) then raise exception 'Store access denied'; end if;
  if exists(select 1 from public.products where store_id=p_store and sample_data and active) then
    raise exception 'This store already has an active starter catalogue';
  end if;

  for r in select * from jsonb_to_recordset($catalog$[
    {"name":"Fresh Tomatoes","unit":"1 kg","category":"fresh","price":4200,"mrp":5000,"cost":2800,"aliases":["tomato","tamatar","टमाटर"],"image":0,"subscribe":false},
    {"name":"Bananas","unit":"6 pieces","category":"fresh","price":4800,"mrp":5500,"cost":3200,"aliases":["banana","kela","केला"],"image":1,"subscribe":false},
    {"name":"Full Cream Milk","unit":"1 litre","category":"dairy","price":6800,"mrp":7000,"cost":6100,"aliases":["milk","doodh","दूध"],"image":2,"subscribe":true},
    {"name":"Whole Wheat Bread","unit":"400 g","category":"breakfast","price":4500,"mrp":5000,"cost":3500,"aliases":["bread","ब्रेड"],"image":3,"subscribe":true},
    {"name":"Basmati Rice","unit":"1 kg","category":"staples","price":12000,"mrp":14500,"cost":9200,"aliases":["rice","chawal","चावल"],"image":4,"subscribe":false},
    {"name":"Chakki Atta","unit":"5 kg","category":"staples","price":24500,"mrp":27500,"cost":20500,"aliases":["atta","ata","aata","flour","आटा"],"image":5,"subscribe":true},
    {"name":"Mustard Oil","unit":"1 litre","category":"staples","price":16500,"mrp":18500,"cost":14000,"aliases":["oil","sarson tel","तेल"],"image":6,"subscribe":false},
    {"name":"Assam Tea","unit":"250 g","category":"beverages","price":14500,"mrp":16500,"cost":11800,"aliases":["tea","chai","चाय"],"image":7,"subscribe":false},
    {"name":"Fresh Paneer","unit":"200 g","category":"dairy","price":9500,"mrp":11000,"cost":7600,"aliases":["paneer","पनीर"],"image":8,"subscribe":true},
    {"name":"Potatoes","unit":"1 kg","category":"fresh","price":3200,"mrp":4000,"cost":2200,"aliases":["potato","aloo","आलू"],"image":9,"subscribe":false},
    {"name":"Marie Biscuits","unit":"250 g","category":"snacks","price":3500,"mrp":4000,"cost":2700,"aliases":["biscuit","cookies","बिस्कुट"],"image":10,"subscribe":false},
    {"name":"Toor Dal","unit":"1 kg","category":"staples","price":15500,"mrp":17500,"cost":12800,"aliases":["dal","arhar","lentils","दाल"],"image":11,"subscribe":false},
    {"name":"Red Onions","unit":"1 kg","category":"fresh","price":3800,"mrp":4500,"cost":2600,"aliases":["onion","pyaz","प्याज़"],"image":12,"subscribe":false},
    {"name":"Red Apples","unit":"4 pieces","category":"fresh","price":14900,"mrp":17900,"cost":11200,"aliases":["apple","seb","सेब"],"image":13,"subscribe":false},
    {"name":"Plain Dahi","unit":"400 g","category":"dairy","price":7500,"mrp":8000,"cost":6000,"aliases":["curd","yogurt","dahi","दही"],"image":14,"subscribe":true},
    {"name":"Farm Eggs","unit":"6 pieces","category":"breakfast","price":6500,"mrp":7200,"cost":5200,"aliases":["egg","ande","अंडे"],"image":15,"subscribe":true},
    {"name":"Fine Sugar","unit":"1 kg","category":"staples","price":4800,"mrp":5500,"cost":3900,"aliases":["sugar","cheeni","चीनी"],"image":16,"subscribe":false},
    {"name":"Iodised Salt","unit":"1 kg","category":"staples","price":2400,"mrp":2800,"cost":1800,"aliases":["salt","namak","नमक"],"image":17,"subscribe":false},
    {"name":"Everyday Masala","unit":"100 g","category":"staples","price":7200,"mrp":8500,"cost":5400,"aliases":["spices","masala","मसाला"],"image":18,"subscribe":false},
    {"name":"Orange Juice","unit":"1 litre","category":"beverages","price":9900,"mrp":12000,"cost":7600,"aliases":["juice","orange drink","जूस"],"image":19,"subscribe":false},
    {"name":"Laundry Detergent","unit":"1 kg","category":"household","price":11500,"mrp":13500,"cost":8900,"aliases":["detergent","washing powder","सर्फ"],"image":20,"subscribe":false},
    {"name":"Bath Soap","unit":"pack of 2","category":"household","price":7800,"mrp":9000,"cost":5900,"aliases":["soap","sabun","साबुन"],"image":21,"subscribe":false},
    {"name":"Instant Noodles","unit":"pack of 4","category":"snacks","price":6000,"mrp":7000,"cost":4700,"aliases":["noodles","नूडल्स"],"image":22,"subscribe":false},
    {"name":"Classic Coffee","unit":"100 g","category":"beverages","price":17500,"mrp":19500,"cost":14200,"aliases":["coffee","कॉफ़ी"],"image":23,"subscribe":false}
  ]$catalog$::jsonb) as x(name text,unit text,category text,price integer,mrp integer,cost integer,aliases jsonb,image integer,subscribe boolean)
  loop
    insert into public.products(store_id,name,unit,category,price,mrp,aliases,image_index,active,subscription_enabled,reorder_level,sample_data)
    values(p_store,r.name,r.unit,r.category,r.price,r.mrp,array(select jsonb_array_elements_text(r.aliases)),r.image,true,r.subscribe,8,true)
    returning id into v_product;
    insert into public.product_costs(product_id,unit_cost) values(v_product,r.cost);
    v_date := case when r.category='fresh' then public.india_today()+7 when r.category='dairy' then public.india_today()+10 when r.category='breakfast' then public.india_today()+20 else null end;
    insert into public.inventory_batches(product_id,label,best_before,units) values(v_product,'Starter stock',v_date,30) returning id into v_batch;
    insert into public.stock_movements(batch_id,delta,reason,actor_id) values(v_batch,30,'starter_catalogue',auth.uid());
    v_count := v_count+1;
  end loop;
  insert into public.audit_log(store_id,actor_id,action) values(p_store,auth.uid(),'starter_catalogue_added');
  return v_count;
end$$;

create or replace function public.remove_sample_catalog(p_store uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_deleted integer;v_unlisted integer;
begin
  if not public.owns_store(p_store) then raise exception 'Store access denied'; end if;
  update public.products set active=false where store_id=p_store and sample_data;
  get diagnostics v_unlisted=row_count;
  delete from public.stock_movements m using public.inventory_batches b,public.products p
   where m.batch_id=b.id and b.product_id=p.id and p.store_id=p_store and p.sample_data
     and not exists(select 1 from public.order_items i where i.product_id=p.id);
  delete from public.product_costs c using public.products p
   where c.product_id=p.id and p.store_id=p_store and p.sample_data
     and not exists(select 1 from public.order_items i where i.product_id=p.id);
  delete from public.inventory_batches b using public.products p
   where b.product_id=p.id and p.store_id=p_store and p.sample_data
     and not exists(select 1 from public.order_items i where i.product_id=p.id);
  delete from public.products p where p.store_id=p_store and p.sample_data
     and not exists(select 1 from public.order_items i where i.product_id=p.id);
  get diagnostics v_deleted=row_count;
  insert into public.audit_log(store_id,actor_id,action) values(p_store,auth.uid(),'starter_catalogue_removed');
  return jsonb_build_object('removed',v_deleted,'unlisted_for_history',v_unlisted-v_deleted);
end$$;

revoke all on function public.seed_sample_catalog(uuid),public.remove_sample_catalog(uuid) from public,anon;
grant execute on function public.seed_sample_catalog(uuid),public.remove_sample_catalog(uuid) to authenticated;
grant all on all tables in schema public to service_role;

commit;
