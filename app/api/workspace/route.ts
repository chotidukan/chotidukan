import { validDate } from '../../../lib/inventory';
import { saveSubscription, previewSubscription } from '../../../lib/subscriptions';
import { getCurrentUser } from '../../auth';
import { readWorkspace, saveWorkspace } from '../../../lib/workspace';
import { CATEGORIES, createOrder, deliveryStatus, DomainError, isPoint, type Product, type Store } from '../../../lib/domain';

export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => Response.json(data,{status, headers:{'Cache-Control':'no-store'}});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return response({error:'Please sign in to save your demo.'},401);
  try { return response(await readWorkspace(user.userId)); }
  catch { return response({error:'We could not load your demo. Please try again.'},503); }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return response({error:'Please sign in to save your demo.'},401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return response({error:'Invalid request origin.'},403);
  let body;
  try { const raw = await request.text(); if(raw.length>80000) return response({error:'Request is too large.'},413); body=JSON.parse(raw); }
  catch { return response({error:'Please send a valid request.'},400); }
  if(!body || typeof body !== 'object') return response({error:'Invalid request.'},400);
  try {
    for(let attempt=0;attempt<3;attempt++) {
      const {state,revision} = await readWorkspace(user.userId);
      let next = structuredClone(state); let orderId: string | undefined;
      if(body.action === 'checkout') {
        const result = createOrder(state,body); next=result.state; orderId=result.order.id;
        if(next===state) return response({state,revision,orderId});
      } else if(body.action === 'product') {
        const v=body.product;
        if(!v || !state.stores.some(s=>s.id===v.storeId)) throw new DomainError('Select a valid store.');
        const previous = v.id ? state.products.find(p=>p.id===v.id && p.storeId===v.storeId) : null;
        if(v.id && !previous) throw new DomainError('This product was not found.');
        if(typeof v.name !== 'string' || !v.name.trim() || v.name.length>90 || typeof v.unit !== 'string' || !v.unit.trim() || v.unit.length>30) throw new DomainError('Add a product name and pack size.');
        if(!Number.isInteger(v.price) || v.price<100 || v.price>10000000 || !Number.isInteger(v.mrp) || v.mrp<v.price || v.mrp>10000000) throw new DomainError('Enter a valid price and MRP.');
        if(!Number.isInteger(v.stock)||v.stock<0||v.stock>100000) throw new DomainError('Stock must be a whole number from 0 to 100,000.');
        if(!CATEGORIES.some(c=>c.id===v.category && c.id!=='all') || !Number.isInteger(v.image) || v.image<0 || v.image>11) throw new DomainError('Choose a category and product image.');
        if(v.aliases!==undefined&&(!Array.isArray(v.aliases)||v.aliases.length>20||v.aliases.some((a:unknown)=>typeof a!=='string'||a.length>40)))throw new DomainError('Use up to 20 search aliases, each under 40 characters.');
        if(v.subscriptionEligible!==undefined&&typeof v.subscriptionEligible!=='boolean')throw new DomainError('Choose whether this product supports subscriptions.');
        if(v.batches!==undefined){
          if(!Array.isArray(v.batches)||v.batches.length<1||v.batches.length>30)throw new DomainError('Add between 1 and 30 stock batches.');
          const ids=new Set();let total=0;
          for(const b of v.batches){
            if(!b||typeof b.id!=='string'||!b.id||b.id.length>80||ids.has(b.id)||!validDate(b.bestBefore)||!Number.isInteger(b.quantity)||b.quantity<0||b.quantity>100000||!Number.isInteger(b.saleLeadDays)||b.saleLeadDays<0||b.saleLeadDays>30)throw new DomainError('Each batch needs a unique ID, valid date, quantity and a sale window of 0–30 days.');
            if(b.salePrice!==undefined&&(!Number.isInteger(b.salePrice)||b.salePrice<100||b.salePrice>=v.price))throw new DomainError('A batch sale price must be at least ₹1 and below the regular price.');
            ids.add(b.id);total+=b.quantity;
          }
          if(total!==v.stock||total>100000)throw new DomainError('Stock must equal the total quantity across all batches (maximum 100,000).');
        }
        const p:Product={id:previous?.id||crypto.randomUUID(),storeId:v.storeId,name:v.name.trim(),unit:v.unit.trim(),price:v.price,mrp:v.mrp,stock:v.stock,category:v.category,image:v.image,featured:previous?.featured,aliases:v.aliases??previous?.aliases,subscriptionEligible:v.subscriptionEligible??previous?.subscriptionEligible,batches:v.batches};
        if(previous) next.products=next.products.map(x=>x.id===p.id?p:x); else next.products.push(p);
      } else if(body.action === 'subscription') {
        next=saveSubscription(state,body.subscription);
      } else if(body.action === 'subscription-status') {
        const sub=next.subscriptions?.find(s=>s.id===body.id);
        if(!sub||sub.status==='cancelled'||!['active','paused','cancelled'].includes(body.status))throw new DomainError('This subscription cannot be updated.');
        sub.status=body.status;
      } else if(body.action === 'subscription-preview') {
        const result=previewSubscription(state,body.id,body.date);next=result.state;orderId=result.order.id;
        if(next===state)return response({state,revision,orderId});
      } else if(body.action === 'store') {
        const v=body.store;
        if(!v||typeof v.name!=='string'||!v.name.trim()||v.name.length>80||typeof v.locality!=='string'||!v.locality.trim()||v.locality.length>100||!isPoint({lat:v.lat,lng:v.lng})) throw new DomainError('Add a store name, locality, and valid coordinates.');
        if(!['store','platform'].includes(v.delivery)||!Number.isInteger(v.eta)||v.eta<5||v.eta>120||typeof v.open!=='boolean') throw new DomainError('Choose a delivery provider and an estimate of 5–120 minutes.');
        const prev=v.id?state.stores.find(s=>s.id===v.id):null;
        if(v.id&&!prev) throw new DomainError('This store was not found.');
        const s:Store={id:prev?.id||crypto.randomUUID(),name:v.name.trim(),tagline:prev?.tagline||'Your neighbourhood’s newest online store.',locality:v.locality.trim(),since:prev?.since||new Date().getFullYear(),lat:v.lat,lng:v.lng,delivery:v.delivery,eta:v.eta,open:v.open,theme:prev?.theme||'saffron',initials:v.name.trim().split(/\s+/).slice(0,2).map((x:string)=>x[0]).join('').toUpperCase()};
        if(prev)next.stores=next.stores.map(x=>x.id===s.id?s:x); else next.stores.push(s);
      } else if(body.action === 'advance') {
        const o=next.orders.find(o=>o.id===body.orderId); const d=o?.deliveries.find(d=>d.id===body.deliveryId);
        if(!o||!d)throw new DomainError('Delivery not found.');
        d.status=Math.min(3,deliveryStatus(o,d,Date.now())+1);
      } else if(body.action === 'finish') {
        const o=next.orders.find(o=>o.id===body.orderId);
        if(!o)throw new DomainError('Order not found.');
        o.deliveries.forEach(d=>{d.status=3;});
      } else { return response({error:'Unknown action.'},400); }
      if(await saveWorkspace(user.userId,next,revision)) return response({state:next,revision:revision+1,orderId});
    }
    return response({error:'Your inventory changed in another window. Refresh and try again.'},409);
  } catch(error) { return response({error:error instanceof DomainError?error.message:'We could not save this change. Please try again.'},error instanceof DomainError?400:503); }
}
