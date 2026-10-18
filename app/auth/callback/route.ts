import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
export async function GET(request:Request){
  const url=new URL(request.url);const code=url.searchParams.get('code');
  if(code){const supabase=await createClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/',url.origin));}
  return NextResponse.redirect(new URL('/signin?message=Confirmation+could+not+complete.+Try+signing+in+or+request+a+new+confirmation+email.',url.origin));
}
