const url = 'https://hrebuxetwdknhvbrohla.supabase.co';
const key = 'sb_publishable_9Jq-7jvCVaRw7YNRqQK9Kw_vfMPa0Mx';

async function run() {
  if (!url || !key) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: key },
    });

    if (!response.ok) {
      console.error(`Supabase connection failed with HTTP ${response.status}.`);
      process.exit(1);
    }

    console.log(`Supabase connection succeeded (HTTP ${response.status}).`);
  } catch {
    console.error('Supabase connection failed due to a network or invalid URL error.');
    process.exit(1);
  }
}

run();
