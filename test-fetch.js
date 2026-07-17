import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();
async function run() {
  const url = getEnv('VITE_SUPABASE_URL') + '/auth/v1/signup';
  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testfetch500@gecko.io.vn', password: 'Password123!' })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}
run();
