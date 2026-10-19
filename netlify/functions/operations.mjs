import {createClient}from '@supabase/supabase-js';
export default async function(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Operations database credentials missing');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const expired=await db.rpc('expire_unpaid_orders');if(expired.error)throw new Error('Order reservation cleanup failed');
 const subscriptions=await db.rpc('run_subscriptions');if(subscriptions.error)throw new Error('Subscription processing failed');
 console.log(JSON.stringify({released:expired.data,subscriptionOccurrences:subscriptions.data}));
}
export const config={schedule:'*/5 * * * *'};
