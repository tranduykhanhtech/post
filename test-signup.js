import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
async function run() {
  const { data, error } = await supabase.auth.signUp({ email: 'test500@gecko.io.vn', password: 'Password123!' });
  console.log('Signup Result:', data, error);
}
run();
