import {NextResponse}from 'next/server';import {createClient}from '../../../lib/supabase/server';
export async function POST(request:Request){const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin)return new Response('Invalid origin',{status:403});await(await createClient()).auth.signOut();return NextResponse.redirect(new URL('/',origin),303);}
