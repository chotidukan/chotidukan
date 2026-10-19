import {createClient} from './supabase/server';
export async function currentUser(){const db=await createClient();const {data:{user},error}=await db.auth.getUser();return error?null:user;}
export {phoneNumber} from './phone';
