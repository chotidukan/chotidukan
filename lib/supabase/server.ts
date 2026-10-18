import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function createClient() {
  if(!isSupabaseConfigured()) throw new Error('Supabase is not configured. Follow README.md.');
  const store=await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookies:{getAll(){return store.getAll();},setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options));}catch{/* Server Components cannot set cookies. proxy.ts refreshes them. */}}},
  });
}
