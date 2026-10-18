import { createClient } from '../lib/supabase/server';

export async function getCurrentUser() {
  const supabase=await createClient();
  // getUser validates against Supabase Auth; no caller-supplied identity headers.
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user||!user.email)return null;
  const fullName=typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:null;
  return {userId:user.id,email:user.email,displayName:fullName||user.email,fullName};
}
export function signInPath(_returnTo='/'){return '/signin';}
export function signOutPath(_returnTo='/'){return '/auth/signout';}
