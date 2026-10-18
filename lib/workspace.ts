import { createClient } from './supabase/server';
import { initialWorkspace, type Workspace } from './domain';

export async function readWorkspace(userId:string):Promise<{state:Workspace;revision:number}> {
  const db=await createClient();
  const {error:insertError}=await db.from('demo_workspaces').upsert({user_id:userId,data:initialWorkspace(),revision:0,updated_at:new Date().toISOString()},{onConflict:'user_id',ignoreDuplicates:true});
  if(insertError)throw new Error('Could not initialise your workspace. Check Supabase SQL and RLS setup.');
  const {data,error}=await db.from('demo_workspaces').select('data, revision').eq('user_id',userId).single();
  if(error||!data)throw new Error('Could not load your workspace.');
  return {state:data.data as Workspace,revision:data.revision as number};
}
export async function saveWorkspace(userId:string,state:Workspace,revision:number) {
  const db=await createClient();
  // PostgreSQL atomically applies the update only if the revision still matches.
  // RLS separately enforces auth.uid() = user_id for every statement.
  const {data,error}=await db.from('demo_workspaces').update({data:state,revision:revision+1,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('revision',revision).select('revision').maybeSingle();
  if(error)throw new Error('Could not save your workspace.');
  return data!==null;
}
