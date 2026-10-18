import { isSupabaseConfigured } from '../lib/supabase/server';
import Marketplace from './marketplace';
import { getCurrentUser, signInPath, signOutPath } from './auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if(!isSupabaseConfigured()) return <main className="wrap" style={{paddingTop:80,paddingBottom:80}}><h1 style={{fontSize:36}}>Kesariya is almost ready.</h1><p style={{marginTop:20}}>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Netlify, run the included Supabase SQL, and redeploy.</p><p style={{marginTop:12}}>Follow README.md in the source package for the complete setup.</p></main>;
  const user = await getCurrentUser();
  return <Marketplace user={user ? { name: user.fullName || 'Neighbour', email: user.email } : null} signInUrl={signInPath('/')} signOutUrl={signOutPath('/')} />;
}
