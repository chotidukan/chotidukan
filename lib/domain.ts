import { allocateStock, availableStock, type Batch } from './inventory.ts';
import type { Subscription } from './subscriptions.ts';
export type Point = { lat: number; lng: number };
export type DeliveryMode = 'store' | 'platform';
export type Store = { id: string; name: string; tagline: string; locality: string; since: number; lat: number; lng: number; delivery: DeliveryMode; eta: number; open: boolean; theme: string; initials: string };
export type Product = { id: string; storeId: string; name: string; unit: string; price: number; mrp: number; stock: number; category: string; image: number; featured?: boolean; batches?: Batch[]; aliases?: string[]; subscriptionEligible?: boolean };
export type CartLine = { productId: string; quantity: number };
export type OrderItem = { productId: string; name: string; unit: string; image: number; quantity: number; price: number; batchId?: string; bestBefore?: string };
export type Delivery = { id: string; storeId: string; storeName: string; mode: DeliveryMode; etaAt: number; items: OrderItem[]; subtotal: number; fee: number; status: number };
export type Order = { id: string; requestId: string; createdAt: number; address: string; payment: 'upi' | 'card'; total: number; deliveries: Delivery[]; subscriptionId?: string; scheduledFor?: number };
export type Workspace = { stores: Store[]; products: Product[]; orders: Order[]; subscriptions?: Subscription[] };
export const SAMPLE_LOCATION: Point = { lat: 28.4116, lng: 77.3460 };
export const CATEGORIES = [
  { id: 'all', name: 'All essentials', image: 0 },
  { id: 'fresh', name: 'Fruits & vegetables', image: 1 },
  { id: 'dairy', name: 'Dairy & paneer', image: 2 },
  { id: 'staples', name: 'Atta, rice & dal', image: 5 },
  { id: 'breakfast', name: 'Bread & breakfast', image: 3 },
  { id: 'snacks', name: 'Snacks & biscuits', image: 10 },
  { id: 'beverages', name: 'Tea & beverages', image: 7 },
];
export const STATUS_LABELS = ['Confirmed', 'Packing', 'On the way', 'Delivered'];

export function distanceKm(a: Point, b: Point): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function isPoint(p: unknown): p is Point {
  if (!p || typeof p !== 'object') return false;
  const v = p as Point;
  return Number.isFinite(v.lat) && Number.isFinite(v.lng) && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180;
}
export function nearbyStores(stores: Store[], location: Point) {
  return stores.map(s => ({ ...s, distance: distanceKm(location, s) })).filter(s => s.distance <= 1).sort((a,b) => a.distance - b.distance);
}
export function money(paise: number) { return '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
export function deliveryFee(subtotal: number) { return subtotal >= 29900 ? 0 : 1900; }
export function deliveryStatus(order: Order, delivery: Delivery, now: number) {
  const startsAt=order.scheduledFor?order.scheduledFor-30*60_000:order.createdAt;
  const progress = (now - startsAt) / Math.max(1, delivery.etaAt - startsAt);
  return Math.max(delivery.status, progress >= 1 ? 3 : progress >= 0.5 ? 2 : progress >= 0.12 ? 1 : 0);
}
export function remainingTime(etaAt: number, now: number) {
  const s = Math.max(0, Math.ceil((etaAt - now) / 1000));
  const mm=String(Math.floor(s/60)%60).padStart(2,'0'),ss=String(s%60).padStart(2,'0');
  if(s>=86400)return `${Math.floor(s/86400)}d ${String(Math.floor(s/3600)%24).padStart(2,'0')}:${mm}:${ss}`;
  if(s>=3600)return `${String(Math.floor(s/3600)).padStart(2,'0')}:${mm}:${ss}`;
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${ss}`;
}
export function initialWorkspace(): Workspace {
  const stores: Store[] = [
    { id:'sharma', name:'Sharma General Store', tagline:'Your family’s favourites, since 1987.', locality:'Sector 88, Faridabad', since:1987, lat:28.4135, lng:77.3472, delivery:'store', eta:18, open:true, theme:'saffron', initials:'SG' },
    { id:'hariom', name:'Hari Om Fresh', tagline:'A little fresher. A little closer.', locality:'Sector 88, Faridabad', since:2012, lat:28.4091, lng:77.3484, delivery:'platform', eta:15, open:true, theme:'green', initials:'HO' },
    { id:'gupta', name:'Gupta Dairy & Daily', tagline:'Good mornings begin here.', locality:'Sector 88, Faridabad', since:1996, lat:28.4157, lng:77.3438, delivery:'store', eta:22, open:true, theme:'blue', initials:'GD' },
    { id:'mittal', name:'Mittal Supermart', tagline:'The everyday, thoughtfully stocked.', locality:'Sector 89, Faridabad', since:2004, lat:28.4070, lng:77.3410, delivery:'platform', eta:25, open:true, theme:'rose', initials:'MS' },
    { id:'greenbasket', name:'Green Basket', tagline:'Fresh finds around the corner.', locality:'Sector 85, Faridabad', since:2018, lat:28.4280, lng:77.3505, delivery:'platform', eta:30, open:true, theme:'green', initials:'GB' },
  ];
  const catalog = [
    ['Farm-fresh tomatoes','500 g',2800,3500,'fresh',0],
    ['Naturally sweet bananas','6 pieces',4800,6000,'fresh',1],
    ['Fresh toned milk','500 ml',2900,3000,'dairy',2],
    ['Whole wheat bread','400 g',4500,5000,'breakfast',3],
    ['Premium basmati rice','1 kg',14900,18000,'staples',4],
    ['Chakki fresh atta','5 kg',23900,28000,'staples',5],
    ['Pure sunflower oil','1 litre',13500,16000,'staples',6],
    ['Everyday Assam tea','250 g',11900,14500,'beverages',7],
    ['Fresh malai paneer','200 g',8500,10000,'dairy',8],
    ['Golden potatoes','1 kg',3400,4200,'fresh',9],
    ['Golden butter biscuits','200 g',3500,4500,'snacks',10],
    ['Unpolished toor dal','1 kg',12900,15000,'staples',11],
  ];
  const selections: Record<string,number[]> = { sharma:[0,2,5,7,4,6,10,11,3], hariom:[1,0,9,8,11], gupta:[2,3,8,10,7], mittal:[5,4,6,7,10,11,3,1], greenbasket:[0,1,2] };
  const products: Product[] = [];
  for (const store of stores) for (const idx of selections[store.id]) {
    const [name,unit,price,mrp,category,image] = catalog[idx];
    products.push({id:`${store.id}-${idx}`,storeId:store.id,name:String(name),unit:String(unit),price:Number(price),mrp:Number(mrp),stock:idx===8?8:32+idx*3,category:String(category),image:Number(image),featured:['sharma-0','gupta-2','hariom-1','sharma-5','gupta-3','sharma-7'].includes(`${store.id}-${idx}`)});
  }
  return {stores,products,orders:[]};
}

export class DomainError extends Error {}

export function createOrder(state: Workspace, input: { lines: CartLine[]; location: Point; address: string; payment: 'upi'|'card'; requestId: string }, now = Date.now(), inventoryAt?: number): { state: Workspace; order: Order } {
  const existing = state.orders.find(o => o.requestId === input.requestId);
  if (existing) return { state, order: existing };
  if (!Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 100) throw new DomainError('Your basket is empty or too large.');
  if (!isPoint(input.location)) throw new DomainError('Choose a valid delivery location.');
  if (typeof input.address !== 'string' || input.address.trim().length < 8 || input.address.length > 250) throw new DomainError('Add a delivery address of 8–250 characters.');
  if (!['upi','card'].includes(input.payment)) throw new DomainError('Choose a test payment method.');
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId)) throw new DomainError('Refresh checkout and try again.');
  const next = structuredClone(state);
  const groups = new Map<string, Delivery>();
  const quantities = new Map<string, number>();
  for (const line of input.lines) {
    if (!line || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new DomainError('Quantities must be between 1 and 99.');
    quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
  }
  for (const [id,quantity] of quantities) {
    if (quantity > 99) throw new DomainError('Maximum 99 of one item per order.');
    const product = next.products.find(p => p.id === id);
    if (!product) throw new DomainError('An item is no longer available. Refresh your basket.');
    const store = next.stores.find(s => s.id === product.storeId);
    if (!store?.open) throw new DomainError(`${store?.name || 'A store'} is currently closed.`);
    if (distanceKm(input.location,store) > 1) throw new DomainError(`${store.name} is outside your 1 km delivery area.`);
    const stockAt=inventoryAt??(now+store.eta*60_000);
    const available=availableStock(product,stockAt);
    if (available < quantity) throw new DomainError(`Only ${available} of ${product.name} are available for this delivery date. Update your basket.`);
    const quote=allocateStock(product,quantity,stockAt);
    if(product.batches){for(const a of quote.allocations){product.batches.find(b=>b.id===a.batchId)!.quantity-=a.quantity;}product.stock=product.batches.reduce((n,b)=>n+b.quantity,0);}else product.stock-=quantity;
    if (!groups.has(store.id)) groups.set(store.id,{id:crypto.randomUUID(),storeId:store.id,storeName:store.name,mode:store.delivery,etaAt:now+store.eta*60_000,items:[],subtotal:0,fee:0,status:0});
    const group = groups.get(store.id)!;
    for(const a of quote.allocations)group.items.push({productId:id,name:product.name,unit:product.unit,image:product.image,...a});
    group.subtotal += quote.total;
  }
  const deliveries = [...groups.values()].map(d => ({...d, fee:deliveryFee(d.subtotal)}));
  const order: Order = {id:`KS-${crypto.randomUUID().slice(0,8).toUpperCase()}`,requestId:input.requestId,createdAt:now,address:input.address.trim(),payment:input.payment,total:deliveries.reduce((n,d)=>n+d.subtotal+d.fee,0),deliveries};
  next.orders.unshift(order);
  return {state:next,order};
}
