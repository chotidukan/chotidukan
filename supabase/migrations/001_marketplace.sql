begin;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text not null default '' check(length(full_name)<=100), created_at timestamptz not null default now());
create table public.marketplace_settings (id boolean primary key default true check(id), allow_cod boolean not null default true, allow_online boolean not null default false);
insert into public.marketplace_settings default values;
create table public.stores (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),name text not null check(length(name) between 2 and 100),description text not null default '' check(length(description)<=500),address text not null check(length(address) between 8 and 300),business_phone text not null check(business_phone ~ '^\+[1-9][0-9]{7,14}$'),lat double precision not null check(lat between -90 and 90),lng double precision not null check(lng between -180 and 180),is_open boolean not null default false,delivery_mode text not null default 'store' check(delivery_mode in ('store','platform')),eta_minutes integer not null default 30 check(eta_minutes between 5 and 180),delivery_fee integer not null default 1900 check(delivery_fee between 0 and 100000),free_delivery_above integer not null default 29900 check(free_delivery_above between 0 and 10000000),created_at timestamptz not null default now()
);
create index stores_owner on public.stores(owner_id);
create table public.products (
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),name text not null check(length(name) between 2 and 120),unit text not null check(length(unit) between 1 and 40),category text not null check(category in ('fresh','dairy','staples','breakfast','snacks','beverages','household')),price integer not null check(price between 100 and 10000000),mrp integer not null check(mrp>=price and mrp<=10000000),aliases text[] not null default '{}',image_index integer not null default 0 check(image_index between 0 and 11),image_url text,active boolean not null default true,subscription_enabled boolean not null default false,reorder_level integer not null default 10 check(reorder_level between 0 and 100000),created_at timestamptz not null default now(),check(cardinality(aliases)<=20)
);
create index products_store on public.products(store_id);
create table public.product_costs(product_id uuid primary key references public.products(id),unit_cost integer check(unit_cost between 0 and 10000000));
create table public.inventory_batches(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),label text not null default '' check(length(label)<=60),best_before date,units integer not null check(units between 0 and 100000),sale_price integer check(sale_price between 100 and 10000000),sale_lead_days integer not null default 3 check(sale_lead_days between 0 and 30),created_at timestamptz not null default now());
create index batches_product_date on public.inventory_batches(product_id,best_before,created_at);
create table public.orders (
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users(id),request_key text not null check(length(request_key) between 16 and 120),payment_method text not null check(payment_method in ('cod','online')),payment_status text not null check(payment_status in ('cod_due','awaiting','paid','collected','refund_required','refunded')),status text not null check(status in ('awaiting_payment','confirmed','completed','cancelled')),total integer not null default 0 check(total>=0),address text not null check(length(address) between 8 and 300),customer_phone text not null,customer_name text not null default '',lat double precision not null,lng double precision not null,razorpay_order_id text unique,razorpay_payment_id text unique,refunded_amount integer not null default 0,expires_at timestamptz,scheduled_for timestamptz,subscription_id uuid,created_at timestamptz not null default now(),unique(customer_id,request_key)
);
create index orders_customer_created on public.orders(customer_id,created_at desc);
create table public.store_orders (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),store_id uuid not null references public.stores(id),customer_id uuid not null references auth.users(id),store_name text not null,store_phone text not null,customer_name text not null,customer_phone text not null,delivery_address text not null,delivery_mode text not null,subtotal integer not null default 0,delivery_fee integer not null default 0,status text not null default 'confirmed' check(status in ('awaiting_payment','confirmed','packing','out_for_delivery','delivered','cancelled')),payment_method text not null,payment_collected boolean not null default false,eta_at timestamptz not null,delivered_at timestamptz,scheduled_for timestamptz,created_at timestamptz not null default now(),unique(order_id,store_id)
);
create index store_orders_store_created on public.store_orders(store_id,created_at desc);
create table public.order_items(id uuid primary key default gen_random_uuid(),store_order_id uuid not null references public.store_orders(id),product_id uuid not null references public.products(id),batch_id uuid not null references public.inventory_batches(id),name text not null,unit text not null,category text not null,quantity integer not null check(quantity>0),unit_price integer not null,unit_mrp integer not null,best_before date);
create index order_items_delivery on public.order_items(store_order_id);
create table public.order_item_costs(order_item_id uuid primary key references public.order_items(id),unit_cost integer);
create table public.stock_movements(id uuid primary key default gen_random_uuid(),batch_id uuid not null references public.inventory_batches(id),order_id uuid references public.orders(id),delta integer not null,reason text not null,actor_id uuid references auth.users(id),created_at timestamptz not null default now());
create table public.demand_events(id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),customer_id uuid references auth.users(id),query text not null default '' check(length(query)<=100),event_type text not null check(event_type in ('search','stockout')),product_id uuid references public.products(id),created_at timestamptz not null default now());
create index demand_store_date on public.demand_events(store_id,created_at desc);
create table public.subscriptions(id uuid primary key default gen_random_uuid(),customer_id uuid not null references auth.users(id),product_id uuid not null references public.products(id),quantity integer not null check(quantity between 1 and 99),frequency text not null check(frequency in ('daily','alternate','weekly')),weekdays integer[] not null default '{}',start_date date not null,delivery_time time not null,address text not null check(length(address) between 8 and 300),lat double precision not null,lng double precision not null,status text not null default 'active' check(status in ('active','paused','cancelled')),next_at timestamptz not null,last_error text,created_at timestamptz not null default now());
create index subscriptions_due on public.subscriptions(next_at) where status='active';
create table public.subscription_runs(subscription_id uuid not null references public.subscriptions(id),scheduled_for timestamptz not null,order_id uuid references public.orders(id),error text,created_at timestamptz not null default now(),primary key(subscription_id,scheduled_for));
create table public.payment_events(event_id text primary key,order_id uuid references public.orders(id),event_type text not null,created_at timestamptz not null default now());
create table public.audit_log(id uuid primary key default gen_random_uuid(),store_id uuid references public.stores(id),actor_id uuid references auth.users(id),action text not null,entity_id uuid,created_at timestamptz not null default now());

create function public.owns_store(p_store uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.stores where id=p_store and owner_id=auth.uid())$$;
create function public.km_distance(a double precision,b double precision,c double precision,d double precision) returns double precision language sql immutable as $$select 6371*2*asin(least(1,sqrt(power(sin(radians(c-a)/2),2)+cos(radians(a))*cos(radians(c))*power(sin(radians(d-b)/2),2))))$$;
create function public.india_today() returns date language sql stable as $$select (now() at time zone 'Asia/Kolkata')::date$$;

alter table public.profiles enable row level security;
create policy profiles_self on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
alter table public.marketplace_settings enable row level security;
create policy settings_read on public.marketplace_settings for select using(true);
alter table public.stores enable row level security;
create policy stores_read on public.stores for select using(is_open or owner_id=auth.uid());
create policy stores_create on public.stores for insert to authenticated with check(owner_id=auth.uid());
create policy stores_update on public.stores for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
alter table public.products enable row level security;
create policy products_read on public.products for select using(public.owns_store(store_id) or (active and exists(select 1 from public.stores s where s.id=store_id and s.is_open)));
alter table public.product_costs enable row level security;
create policy costs_owner on public.product_costs for select to authenticated using(exists(select 1 from public.products p where p.id=product_id and public.owns_store(p.store_id)));
alter table public.inventory_batches enable row level security;
create policy batches_read on public.inventory_batches for select using(exists(select 1 from public.products p join public.stores s on s.id=p.store_id where p.id=product_id and (s.owner_id=auth.uid() or (s.is_open and p.active))));
alter table public.orders enable row level security;
create policy orders_customer on public.orders for select to authenticated using(customer_id=auth.uid());
alter table public.store_orders enable row level security;
create policy deliveries_read on public.store_orders for select to authenticated using(customer_id=auth.uid() or public.owns_store(store_id));
alter table public.order_items enable row level security;
create policy items_read on public.order_items for select to authenticated using(exists(select 1 from public.store_orders so where so.id=store_order_id and (so.customer_id=auth.uid() or public.owns_store(so.store_id))));
alter table public.order_item_costs enable row level security;
create policy item_cost_owner on public.order_item_costs for select to authenticated using(exists(select 1 from public.order_items i join public.store_orders so on so.id=i.store_order_id where i.id=order_item_id and public.owns_store(so.store_id)));
alter table public.stock_movements enable row level security;
create policy movements_owner on public.stock_movements for select to authenticated using(exists(select 1 from public.inventory_batches b join public.products p on p.id=b.product_id where b.id=batch_id and public.owns_store(p.store_id)));
alter table public.demand_events enable row level security;
create policy demand_owner on public.demand_events for select to authenticated using(public.owns_store(store_id));
alter table public.subscriptions enable row level security;
create policy subscriptions_customer on public.subscriptions for select to authenticated using(customer_id=auth.uid());
-- Owners see only their product's committed replenishment schedule; addresses remain private.
create function public.owner_subscription_demand(p_store uuid) returns table(product_id uuid,quantity integer,frequency text,weekdays integer[],start_date date,delivery_time time,next_at timestamptz) language plpgsql stable security definer set search_path=public,pg_temp as $$begin if not public.owns_store(p_store) then raise exception 'Store access denied';end if;return query select s.product_id,s.quantity,s.frequency,s.weekdays,s.start_date,s.delivery_time,s.next_at from public.subscriptions s join public.products p on p.id=s.product_id where p.store_id=p_store and s.status='active';end$$;
alter table public.subscription_runs enable row level security;
create policy runs_customer on public.subscription_runs for select to authenticated using(exists(select 1 from public.subscriptions s where s.id=subscription_id and s.customer_id=auth.uid()));
alter table public.payment_events enable row level security;
alter table public.audit_log enable row level security;
create policy audit_owner on public.audit_log for select to authenticated using(public.owns_store(store_id));

grant select on public.marketplace_settings,public.stores,public.products,public.inventory_batches to anon,authenticated;
grant select,insert,update on public.profiles,public.stores to authenticated;
grant select on public.product_costs,public.orders,public.store_orders,public.order_items,public.order_item_costs,public.stock_movements,public.demand_events,public.subscriptions,public.subscription_runs,public.audit_log to authenticated;
revoke insert,update,delete on public.products,public.product_costs,public.inventory_batches,public.orders,public.store_orders,public.order_items,public.order_item_costs,public.stock_movements,public.demand_events,public.subscriptions,public.subscription_runs,public.payment_events,public.audit_log from anon,authenticated;

create function public.save_product(p_store uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;v_cost integer;begin
 if not public.owns_store(p_store) then raise exception 'Store access denied';end if;
 if jsonb_typeof(p_data->'aliases') is distinct from 'array' or jsonb_array_length(p_data->'aliases')>20 or exists(select 1 from jsonb_array_elements_text(p_data->'aliases') a where length(a)>40) then raise exception 'Invalid aliases';end if;
 v_id=nullif(p_data->>'id','')::uuid;
 if v_id is not null then perform 1 from public.products where id=v_id and store_id=p_store for update;if not found then raise exception 'Product access denied';end if;end if;
 v_id=coalesce(v_id,gen_random_uuid());
 insert into public.products(id,store_id,name,unit,category,price,mrp,aliases,image_index,image_url,active,subscription_enabled,reorder_level)
 values(v_id,p_store,trim(p_data->>'name'),trim(p_data->>'unit'),p_data->>'category',(p_data->>'price')::integer,(p_data->>'mrp')::integer,array(select jsonb_array_elements_text(p_data->'aliases')),coalesce((p_data->>'image_index')::integer,0),nullif(p_data->>'image_url',''),coalesce((p_data->>'active')::boolean,true),coalesce((p_data->>'subscription_enabled')::boolean,false),coalesce((p_data->>'reorder_level')::integer,10))
 on conflict(id) do update set name=excluded.name,unit=excluded.unit,category=excluded.category,price=excluded.price,mrp=excluded.mrp,aliases=excluded.aliases,image_index=excluded.image_index,image_url=excluded.image_url,active=excluded.active,subscription_enabled=excluded.subscription_enabled,reorder_level=excluded.reorder_level;
 v_cost=nullif(p_data->>'unit_cost','')::integer;
 insert into public.product_costs values(v_id,v_cost) on conflict(product_id) do update set unit_cost=excluded.unit_cost;
 insert into public.audit_log(store_id,actor_id,action,entity_id) values(p_store,auth.uid(),'product_saved',v_id);return v_id;
end$$;
create function public.receive_stock(p_product uuid,p_units integer,p_date date,p_label text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_store uuid;v_batch uuid;begin
 select store_id into v_store from public.products where id=p_product for update;
 if not public.owns_store(v_store) then raise exception 'Product access denied';end if;
 if p_units<1 or p_units>100000 then raise exception 'Quantity must be 1 to 100000';end if;
 insert into public.inventory_batches(product_id,units,best_before,label) values(p_product,p_units,p_date,coalesce(p_label,'')) returning id into v_batch;
 insert into public.stock_movements(batch_id,delta,reason,actor_id)values(v_batch,p_units,'stock_received',auth.uid());return v_batch;
end$$;
create function public.adjust_batch(p_batch uuid,p_delta integer,p_reason text,p_sale integer default null,p_lead integer default 3) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_product uuid;v_store uuid;v_price integer;begin
 select b.product_id into v_product from public.inventory_batches b where b.id=p_batch;
 select store_id,price into v_store,v_price from public.products where id=v_product for update;
 if not public.owns_store(v_store) then raise exception 'Batch access denied';end if;
 if p_delta>0 or p_delta < -100000 or (p_delta<>0 and length(trim(coalesce(p_reason,'')))<5) then raise exception 'Use Receive stock for additions; removals require a reason';end if;
 if p_sale is not null and (p_sale<100 or p_sale>=v_price) then raise exception 'Sale price must be below regular price and at least one rupee';end if;
 update public.inventory_batches set units=units+p_delta,sale_price=p_sale,sale_lead_days=p_lead where id=p_batch;
 if p_delta<>0 then insert into public.stock_movements(batch_id,delta,reason,actor_id)values(p_batch,p_delta,left(p_reason,200),auth.uid());end if;
end$$;

create function public._create_order(p_customer uuid,p_key text,p_cart jsonb,p_address text,p_lat double precision,p_lng double precision,p_method text,p_scheduled timestamptz default null,p_subscription uuid default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_order uuid;v_existing public.orders;v_line record;v_product public.products;v_store public.stores;v_delivery uuid;v_batch public.inventory_batches;v_left integer;v_take integer;v_price integer;v_item uuid;v_cost integer;v_date date;v_phone text;v_name text;v_total integer;
begin
 perform pg_advisory_xact_lock(hashtext(p_customer::text));
 select * into v_existing from public.orders where customer_id=p_customer and request_key=p_key;
 if found then return jsonb_build_object('id',v_existing.id,'total',v_existing.total,'payment_status',v_existing.payment_status);end if;
 select phone into v_phone from auth.users where id=p_customer and phone_confirmed_at is not null;
 if v_phone is null then raise exception 'A verified phone number is required';end if;
 if p_key is null or length(p_key) not between 16 and 120 or length(trim(p_address)) not between 8 and 300 or p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'Invalid checkout information';end if;
 if jsonb_typeof(p_cart) is distinct from 'array' or jsonb_array_length(p_cart) not between 1 and 100 then raise exception 'Basket must contain 1 to 100 products';end if;
 if exists(select 1 from jsonb_array_elements(p_cart) x where jsonb_typeof(x->'quantity') is distinct from 'number' or (x->>'quantity')!~'^[0-9]{1,2}$' or (x->>'quantity')::int not between 1 and 99 or x->>'productId' is null) then raise exception 'Invalid basket quantity';end if;
 if (select count(*) from public.orders where customer_id=p_customer and status='awaiting_payment')>=3 then raise exception 'Finish or wait for your pending payments before ordering again';end if;
 if p_subscription is null and (select count(*) from public.orders where customer_id=p_customer and created_at>now()-interval '1 hour')>=30 then raise exception 'Too many orders. Please try later';end if;
 if not exists(select 1 from public.marketplace_settings where (p_method='cod' and allow_cod) or (p_method='online' and allow_online)) then raise exception 'Payment method is not available';end if;
 select coalesce(nullif(full_name,''),'Customer') into v_name from public.profiles where id=p_customer;v_name=coalesce(v_name,'Customer');
 insert into public.orders(customer_id,request_key,payment_method,payment_status,status,address,customer_phone,customer_name,lat,lng,expires_at,scheduled_for,subscription_id)
 values(p_customer,p_key,p_method,case when p_method='cod' then 'cod_due' else 'awaiting' end,case when p_method='cod' then 'confirmed' else 'awaiting_payment' end,trim(p_address),v_phone,v_name,p_lat,p_lng,case when p_method='online' then now()+interval '15 minutes' end,p_scheduled,p_subscription) returning id into v_order;
 for v_line in select (x->>'productId')::uuid as product_id,sum((x->>'quantity')::int)::int as qty from jsonb_array_elements(p_cart) x group by 1 order by 1 loop
  if v_line.qty>99 then raise exception 'Maximum 99 of one product';end if;
  select * into v_product from public.products where id=v_line.product_id and active for update;
  if not found then raise exception 'A product is no longer available';end if;
  select * into v_store from public.stores where id=v_product.store_id;
  if not v_store.is_open or public.km_distance(p_lat,p_lng,v_store.lat,v_store.lng)>1 then raise exception 'Store is closed or outside your one kilometre delivery area';end if;
  if p_subscription is not null and not v_product.subscription_enabled then raise exception 'Product subscription is no longer available';end if;
  v_date=(coalesce(p_scheduled,now()+make_interval(mins=>v_store.eta_minutes)) at time zone 'Asia/Kolkata')::date;
  insert into public.store_orders(order_id,store_id,customer_id,store_name,store_phone,customer_name,customer_phone,delivery_address,delivery_mode,status,payment_method,eta_at,scheduled_for)
  values(v_order,v_store.id,p_customer,v_store.name,v_store.business_phone,v_name,v_phone,trim(p_address),v_store.delivery_mode,case when p_method='cod' then 'confirmed' else 'awaiting_payment' end,p_method,coalesce(p_scheduled,now()+make_interval(mins=>v_store.eta_minutes)),p_scheduled)
  on conflict(order_id,store_id) do nothing;
  select id into v_delivery from public.store_orders where order_id=v_order and store_id=v_store.id;
  select unit_cost into v_cost from public.product_costs where product_id=v_product.id;
  v_left=v_line.qty;
  for v_batch in select * from public.inventory_batches where product_id=v_product.id and units>0 and (best_before is null or best_before>=v_date) order by best_before asc nulls last,created_at,id for update loop
   exit when v_left=0;v_take=least(v_left,v_batch.units);
   v_price=case when v_batch.sale_price is not null and v_batch.sale_price<v_product.price and v_batch.best_before between v_date and v_date+v_batch.sale_lead_days then v_batch.sale_price else v_product.price end;
   update public.inventory_batches set units=units-v_take where id=v_batch.id;
   insert into public.order_items(store_order_id,product_id,batch_id,name,unit,category,quantity,unit_price,unit_mrp,best_before)values(v_delivery,v_product.id,v_batch.id,v_product.name,v_product.unit,v_product.category,v_take,v_price,v_product.mrp,v_batch.best_before)returning id into v_item;
   insert into public.order_item_costs values(v_item,v_cost);
   insert into public.stock_movements(batch_id,order_id,delta,reason,actor_id)values(v_batch.id,v_order,-v_take,'order_reserved',p_customer);
   v_left=v_left-v_take;
  end loop;
  if v_left>0 then raise exception 'Insufficient date-valid stock for %',v_product.name;end if;
 end loop;
 update public.store_orders so set subtotal=(select sum(quantity*unit_price) from public.order_items where store_order_id=so.id) where so.order_id=v_order;
 update public.store_orders so set delivery_fee=case when so.subtotal>=s.free_delivery_above then 0 else s.delivery_fee end from public.stores s where so.order_id=v_order and so.store_id=s.id;
 select sum(subtotal+delivery_fee)::int into v_total from public.store_orders where order_id=v_order;
 update public.orders set total=v_total where id=v_order;
 return jsonb_build_object('id',v_order,'total',v_total,'payment_status',case when p_method='cod' then 'cod_due' else 'awaiting' end);
end$$;
create function public.place_order(p_key text,p_cart jsonb,p_address text,p_lat double precision,p_lng double precision,p_method text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin if auth.uid() is null then raise exception 'Sign in required';end if;return public._create_order(auth.uid(),p_key,p_cart,p_address,p_lat,p_lng,p_method);end$$;

create function public._release_order(p_order uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row record;begin
 perform 1 from public.orders where id=p_order and status='awaiting_payment' for update;if not found then return;end if;
 for v_row in select i.batch_id,sum(i.quantity)::int qty from public.order_items i join public.store_orders so on so.id=i.store_order_id where so.order_id=p_order group by i.batch_id order by i.batch_id loop
  update public.inventory_batches set units=units+v_row.qty where id=v_row.batch_id;
  insert into public.stock_movements(batch_id,order_id,delta,reason)values(v_row.batch_id,p_order,v_row.qty,'unpaid_order_released');
 end loop;
 update public.orders set status='cancelled' where id=p_order;
 update public.store_orders set status='cancelled' where order_id=p_order;
end$$;
create function public.expire_unpaid_orders() returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare v uuid;n integer=0;begin for v in select id from public.orders where status='awaiting_payment' and expires_at<now() order by created_at limit 100 for update skip locked loop perform public._release_order(v);n=n+1;end loop;return n;end$$;
create function public.attach_payment_order(p_order uuid,p_gateway text) returns text language plpgsql security definer set search_path=public,pg_temp as $$declare v text;begin update public.orders set razorpay_order_id=coalesce(razorpay_order_id,p_gateway)where id=p_order and status='awaiting_payment' returning razorpay_order_id into v;if v is null then raise exception 'Order is not awaiting payment';end if;return v;end$$;
create function public.confirm_payment(p_gateway text,p_payment text,p_amount integer,p_event text) returns text language plpgsql security definer set search_path=public,pg_temp as $$declare v public.orders;begin
 select * into v from public.orders where razorpay_order_id=p_gateway for update;if not found then raise exception 'Unknown payment order';end if;
 if v.payment_method<>'online' or v.total<>p_amount then raise exception 'Payment amount mismatch';end if;
 if v.razorpay_payment_id is not null and v.razorpay_payment_id<>p_payment then raise exception 'Payment reference mismatch';end if;
 insert into public.payment_events(event_id,order_id,event_type)values(p_event,v.id,'captured')on conflict do nothing;
 if v.payment_status in ('paid','refunded','refund_required') then return v.payment_status;end if;
 if v.status='cancelled' then update public.orders set payment_status='refund_required',razorpay_payment_id=p_payment where id=v.id;return 'refund_required';end if;
 update public.orders set payment_status='paid',status='confirmed',razorpay_payment_id=p_payment where id=v.id;
 update public.store_orders set status='confirmed',payment_collected=true where order_id=v.id;return 'paid';
end$$;
create function public.record_refund(p_payment text,p_refunded integer,p_event text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare v public.orders;begin select * into v from public.orders where razorpay_payment_id=p_payment for update;if not found then return;end if;
 if p_refunded<0 or p_refunded>v.total then raise exception 'Invalid refund amount';end if;
 insert into public.payment_events values(p_event,v.id,'refund',now())on conflict do nothing;
 update public.orders set refunded_amount=greatest(refunded_amount,p_refunded),payment_status=case when p_refunded=total then 'refunded' else payment_status end where id=v.id;
end$$;
create function public.progress_delivery(p_delivery uuid,p_status text,p_eta timestamptz default null,p_cash_collected boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.store_orders;v_parent public.orders;begin
 select * into v from public.store_orders where id=p_delivery;if not public.owns_store(v.store_id)then raise exception 'Order access denied';end if;
 select * into v_parent from public.orders where id=v.order_id for update;select * into v from public.store_orders where id=p_delivery for update;
 if v_parent.payment_status not in ('paid','cod_due','collected') or v.status in ('awaiting_payment','cancelled')then raise exception 'Order payment is not confirmed';end if;
 if not ((v.status='confirmed' and p_status='packing')or(v.status='packing'and p_status='out_for_delivery')or(v.status='out_for_delivery'and p_status='delivered')or(v.status=p_status))then raise exception 'Invalid delivery transition';end if;
 if p_status='delivered'and v.payment_method='cod'and not p_cash_collected and not v.payment_collected then raise exception 'Confirm cash collection before completing delivery';end if;
 if p_eta is not null and(p_eta<now()or p_eta>now()+interval '7 days')then raise exception 'Invalid delivery estimate';end if;
 update public.store_orders set status=p_status,eta_at=coalesce(p_eta,eta_at),delivered_at=case when p_status='delivered'then coalesce(delivered_at,now())else delivered_at end,payment_collected=payment_collected or(p_status='delivered'and p_cash_collected) where id=p_delivery;
 if not exists(select 1 from public.store_orders where order_id=v.order_id and status not in('delivered','cancelled'))then update public.orders set status='completed',payment_status=case when payment_method='cod'then 'collected'else payment_status end where id=v.order_id;end if;
 insert into public.audit_log(store_id,actor_id,action,entity_id)values(v.store_id,auth.uid(),'delivery_'||p_status,v.id);
end$$;

create function public.next_subscription_at(p_start date,p_frequency text,p_days integer[],p_time time,p_after timestamptz)returns timestamptz language sql stable as $$
 select min((d::date+p_time)at time zone 'Asia/Kolkata') from generate_series(greatest(p_start,(p_after at time zone 'Asia/Kolkata')::date)::timestamp,greatest(p_start,(p_after at time zone 'Asia/Kolkata')::date)::timestamp+interval '400 days',interval '1 day')d
 where ((d::date+p_time)at time zone 'Asia/Kolkata')>p_after and(p_frequency='daily'or(p_frequency='alternate'and(d::date-p_start)%2=0)or(p_frequency='weekly'and extract(dow from d)::int=any(p_days)))$$;
create function public.save_subscription(p_id uuid,p_data jsonb)returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare v_product public.products;v_store public.stores;v public.subscriptions;v_id uuid;v_next timestamptz;v_days integer[];begin
 if not exists(select 1 from auth.users where id=auth.uid()and phone_confirmed_at is not null)then raise exception 'Verify your phone before subscribing';end if;
 if not(select allow_cod from public.marketplace_settings)then raise exception 'Subscriptions require cash on delivery to be enabled';end if;
 select * into v_product from public.products where id=(p_data->>'product_id')::uuid and active and subscription_enabled;if not found then raise exception 'Subscription is unavailable for this product';end if;
 select * into v_store from public.stores where id=v_product.store_id;
 if not v_store.is_open or public.km_distance((p_data->>'lat')::float,(p_data->>'lng')::float,v_store.lat,v_store.lng)>1 then raise exception 'Store is closed or outside delivery range';end if;
 if p_id is not null then select * into v from public.subscriptions where id=p_id and customer_id=auth.uid()and status<>'cancelled'for update;if not found then raise exception 'Subscription access denied';end if;if v.product_id<>v_product.id then raise exception 'Product cannot be changed';end if;end if;
 v_days=array(select jsonb_array_elements_text(p_data->'weekdays')::int);
 if p_data->>'frequency'not in('daily','alternate','weekly')or exists(select 1 from unnest(v_days)x where x<0 or x>6)or(p_data->>'frequency'='weekly'and cardinality(v_days)=0)then raise exception 'Invalid delivery days';end if;
 if(p_data->>'delivery_time')!~'^(06|07|08|09|12|17|18|19):00$'or(p_data->>'start_date')::date<public.india_today()and p_id is null then raise exception 'Choose a valid start date and time slot';end if;
 if(p_data->>'lat')::float not between -90 and 90 or(p_data->>'lng')::float not between -180 and 180 then raise exception 'Invalid location';end if;
 v_next=public.next_subscription_at((p_data->>'start_date')::date,p_data->>'frequency',v_days,(p_data->>'delivery_time')::time,greatest(now(),coalesce((select max(scheduled_for)from public.subscription_runs where subscription_id=p_id),now())));
 v_id=coalesce(p_id,gen_random_uuid());
 insert into public.subscriptions(id,customer_id,product_id,quantity,frequency,weekdays,start_date,delivery_time,address,lat,lng,next_at,status)values(v_id,auth.uid(),v_product.id,(p_data->>'quantity')::int,p_data->>'frequency',v_days,(p_data->>'start_date')::date,(p_data->>'delivery_time')::time,trim(p_data->>'address'),(p_data->>'lat')::float,(p_data->>'lng')::float,v_next,coalesce(v.status,'active'))
 on conflict(id)do update set quantity=excluded.quantity,frequency=excluded.frequency,weekdays=excluded.weekdays,start_date=excluded.start_date,delivery_time=excluded.delivery_time,address=excluded.address,lat=excluded.lat,lng=excluded.lng,next_at=excluded.next_at,last_error=null;return v_id;
end$$;
create function public.set_subscription_status(p_id uuid,p_status text)returns void language plpgsql security definer set search_path=public,pg_temp as $$declare v public.subscriptions;begin select * into v from public.subscriptions where id=p_id and customer_id=auth.uid()for update;if not found or v.status='cancelled'or p_status not in('active','paused','cancelled')then raise exception 'Subscription access denied';end if;
 update public.subscriptions set status=p_status,next_at=case when p_status='active'then public.next_subscription_at(start_date,frequency,weekdays,delivery_time,greatest(now(),coalesce((select max(scheduled_for)from public.subscription_runs where subscription_id=p_id),now())))else next_at end where id=p_id;
end$$;
create function public.run_subscriptions()returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare s public.subscriptions;r jsonb;e text;n integer=0;begin
 for s in select * from public.subscriptions where status='active'and next_at<=now()+interval '24 hours' order by next_at limit 100 for update skip locked loop
  if exists(select 1 from public.subscription_runs where subscription_id=s.id and scheduled_for=s.next_at)then continue;end if;e=null;r=null;
  begin
   if s.next_at<now()-interval '1 hour'then raise exception 'Delivery window missed; no order was placed';end if;
   r=public._create_order(s.customer_id,'subscription-'||s.id||'-'||extract(epoch from s.next_at)::bigint,jsonb_build_array(jsonb_build_object('productId',s.product_id,'quantity',s.quantity)),s.address,s.lat,s.lng,'cod',s.next_at,s.id);
  exception when others then e=sqlerrm;end;
  insert into public.subscription_runs(subscription_id,scheduled_for,order_id,error)values(s.id,s.next_at,(r->>'id')::uuid,e)on conflict do nothing;
  update public.subscriptions set next_at=public.next_subscription_at(s.start_date,s.frequency,s.weekdays,s.delivery_time,greatest(s.next_at,now())),last_error=e where id=s.id;n=n+1;
 end loop;return n;
end$$;
create function public.record_demand(p_store uuid,p_query text,p_type text,p_product uuid,p_lat float,p_lng float)returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid()is null then return;end if;
 if length(p_query)>100 or p_type not in('search','stockout')or not exists(select 1 from public.stores where id=p_store and is_open and public.km_distance(p_lat,p_lng,lat,lng)<=1)then raise exception 'Invalid demand event';end if;
 if p_product is not null and not exists(select 1 from public.products where id=p_product and store_id=p_store)then raise exception 'Invalid product';end if;
 if(select count(*)from public.demand_events where customer_id=auth.uid()and created_at>now()-interval '1 minute')>=12 then return;end if;
 insert into public.demand_events(store_id,customer_id,query,event_type,product_id)values(p_store,auth.uid(),trim(p_query),p_type,p_product);
end$$;


create function public.cancel_cod_delivery(p_delivery uuid,p_reason text)returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.store_orders;r record;begin
 select * into v from public.store_orders where id=p_delivery;
 if not public.owns_store(v.store_id)then raise exception 'Order access denied';end if;
 perform 1 from public.orders where id=v.order_id for update;select * into v from public.store_orders where id=p_delivery for update;
 if v.payment_method<>'cod'or v.status not in('confirmed','packing')then raise exception 'Only un-dispatched pay-on-delivery orders can be cancelled here';end if;
 if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Add a cancellation reason';end if;
 for r in select batch_id,sum(quantity)::int qty from public.order_items where store_order_id=v.id group by batch_id order by batch_id loop
  update public.inventory_batches set units=units+r.qty where id=r.batch_id;
  insert into public.stock_movements(batch_id,order_id,delta,reason,actor_id)values(r.batch_id,v.order_id,r.qty,'cancelled: '||left(p_reason,150),auth.uid());
 end loop;
 update public.store_orders set status='cancelled'where id=v.id;
 update public.orders set total=(select coalesce(sum(subtotal+delivery_fee),0)from public.store_orders where order_id=v.order_id and status<>'cancelled')where id=v.order_id;
 if not exists(select 1 from public.store_orders where order_id=v.order_id and status<>'cancelled')then update public.orders set status='cancelled'where id=v.order_id;
 elsif not exists(select 1 from public.store_orders where order_id=v.order_id and status not in('delivered','cancelled'))then update public.orders set status='completed',payment_status='collected'where id=v.order_id;end if;
 insert into public.audit_log(store_id,actor_id,action,entity_id)values(v.store_id,auth.uid(),'cod_order_cancelled',v.id);
end$$;
revoke all on function public.cancel_cod_delivery(uuid,text)from public,anon;
grant execute on function public.cancel_cod_delivery(uuid,text)to authenticated;

-- Every definer RPC is private by default; expose only the intended caller surface.
revoke all on function public._create_order(uuid,text,jsonb,text,float,float,text,timestamptz,uuid),public._release_order(uuid),public.expire_unpaid_orders(),public.attach_payment_order(uuid,text),public.confirm_payment(text,text,integer,text),public.record_refund(text,integer,text),public.run_subscriptions() from public,anon,authenticated;
grant execute on function public.expire_unpaid_orders(),public.attach_payment_order(uuid,text),public.confirm_payment(text,text,integer,text),public.record_refund(text,integer,text),public.run_subscriptions() to service_role;
revoke all on function public.save_product(uuid,jsonb),public.receive_stock(uuid,integer,date,text),public.adjust_batch(uuid,integer,text,integer,integer),public.place_order(text,jsonb,text,float,float,text),public.progress_delivery(uuid,text,timestamptz,boolean),public.save_subscription(uuid,jsonb),public.set_subscription_status(uuid,text),public.record_demand(uuid,text,text,uuid,float,float),public.owner_subscription_demand(uuid)from public,anon;
grant execute on function public.save_product(uuid,jsonb),public.receive_stock(uuid,integer,date,text),public.adjust_batch(uuid,integer,text,integer,integer),public.place_order(text,jsonb,text,float,float,text),public.progress_delivery(uuid,text,timestamptz,boolean),public.save_subscription(uuid,jsonb),public.set_subscription_status(uuid,text),public.record_demand(uuid,text,text,uuid,float,float),public.owner_subscription_demand(uuid)to authenticated;
grant all on all tables in schema public to service_role;
commit;
