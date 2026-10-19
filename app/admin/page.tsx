import {redirect} from 'next/navigation';
import {currentUser} from '../../lib/auth';
import {isSiteAdmin} from '../../lib/admin-access';
import {admin} from '../../lib/supabase/admin';
import {money} from '../../lib/commerce';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await currentUser();if(!user)redirect('/admin/signin');
 if(!isSiteAdmin(user,process.env.SITE_ADMIN_USER_IDS))return <main className="wrap live-coming"><h1>Access restricted</h1><p>This account is not authorised for site administration. Sign out and use your administrator account.</p></main>;
 // The service client must only be constructed after the verified-ID check.
 const db=admin();const [stores,open,products,orders,refunds,recent]=await Promise.all([
 db.from('stores').select('id',{count:'exact',head:true}),db.from('stores').select('id',{count:'exact',head:true}).eq('is_open',true),db.from('products').select('id',{count:'exact',head:true}).eq('active',true),db.from('orders').select('id',{count:'exact',head:true}),db.from('orders').select('id',{count:'exact',head:true}).eq('payment_status','refund_required'),db.from('orders').select('id,total,status,payment_status,created_at').order('created_at',{ascending:false}).limit(20)]);
 if([stores,open,products,orders,refunds,recent].some(r=>r.error))return <main className="wrap live-coming"><h1>Overview temporarily unavailable</h1><p>Check the server configuration and reload this page.</p></main>;
 return <main id="main-content" className="wrap admin-overview"><div className="section-heading"><div><span className="eyebrow">PLATFORM OPERATIONS</span><h1>Site overview</h1><p>Live marketplace totals · refresh this page for the latest figures.</p></div></div><div className="metrics-grid">{[['Registered shops',stores.count],['Open shops',open.count],['Active products',products.count],['All orders',orders.count],['Refunds requiring attention',refunds.count]].map(([name,value])=><article className="metric-card" key={name}><div>{name}</div><strong>{value??0}</strong></article>)}</div><section className="report-panel"><h2>Latest 20 orders</h2><p>Order totals include delivery fees. Cancelled and unpaid orders are included; this is an operations list, not revenue.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Placed (IST)</th><th>Total</th><th>Order status</th><th>Payment status</th></tr></thead><tbody>{recent.data?.map(o=><tr key={o.id}><td>{o.id.slice(0,8)}</td><td>{new Date(o.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td><td>{money(o.total)}</td><td>{o.status.replaceAll('_',' ')}</td><td>{o.payment_status.replaceAll('_',' ')}</td></tr>)}</tbody></table></div>{!recent.data?.length&&<p>No orders yet.</p>}</section><p>Refunds and settlements are managed through your payment provider. This overview does not issue refunds or modify orders.</p></main>;
}
