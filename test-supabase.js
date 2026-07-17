import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
async function run() {
  const { data, error } = await supabase.from('articles').select('id').limit(1);
  console.log('Articles:', data, error);
}
run();
