const fetch = require('node-fetch') || global.fetch;
async function test() {
  try {
    const res = await fetch('https://fwdushzwgsehexidhbam.supabase.co/auth/v1/health');
    console.log('Status:', res.status);
  } catch(e) {
    console.log('Fetch error:', e.message);
  }
}
test();
