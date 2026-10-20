import Storefront from './storefront';import {currentUser}from '../lib/auth';import {isSupabaseConfigured}from '../lib/supabase/server';
export const dynamic='force-dynamic';
export default async function Home(){if(!isSupabaseConfigured())return <main id="main-content" className="wrap live-coming"><h1>Good things are on their way.</h1><p>We’re getting your neighbourhood ready. Please check back shortly.</p></main>;const u=await currentUser();return <Storefront customerId={u?.id} signedIn={!!u} phoneVerified={!!u?.phone_confirmed_at}/>;}
