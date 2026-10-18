'use server';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
const message=(text:string)=>'/signin?message='+encodeURIComponent(text);
export async function signIn(form:FormData){
  const email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
  if(!email||!password)redirect(message('Enter your email and password.'));
  const supabase=await createClient();
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error)redirect(message('Could not sign in. Check your details and confirm your email if you just registered.'));
  redirect('/');
}
export async function signUp(form:FormData){
  const email=String(form.get('email')||'').trim(),password=String(form.get('password')||''),name=String(form.get('name')||'').trim().slice(0,80);
  if(!email||password.length<12)redirect(message('For a new account, use a password of at least 12 characters.'));
  const origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
  const supabase=await createClient();
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name||'Neighbour'},emailRedirectTo:new URL('/auth/callback',origin).href}});
  if(error)redirect(message('Could not create an account. Please try again later or contact the demo owner.'));
  if(data.session)redirect('/');
  redirect(message('Check your email to confirm your account, then sign in. Open the confirmation link in this browser.'));
}
