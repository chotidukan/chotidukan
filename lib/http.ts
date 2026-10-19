import {currentUser} from './auth';
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function body(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new Error('Invalid request origin');const text=await request.text();if(text.length>60000)throw new Error('Request too large');return JSON.parse(text);}
export async function requireUser(){const u=await currentUser();if(!u)throw new Error('Sign in required');return u;}
export const fail=(e:unknown)=>json({error:e instanceof Error?e.message:'Request could not complete'},400);
