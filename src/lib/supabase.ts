import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseConnectionResult = {
  success: boolean;
  message: string;
  status?: number;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

function missingConfiguration(): string[] {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return missing;
}

export function getSupabaseConfigurationError(): string | null {
  const missing = missingConfiguration();
  if (missing.length === 0) return null;
  return `Missing Supabase configuration: ${missing.join(', ')}. Add them to MedSupply/.env (see .env.example).`;
}

const configurationError = getSupabaseConfigurationError();

if (!supabaseUrl || !supabaseKey) {
  if (__DEV__) {
    console.error(configurationError);
  }
}

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(configurationError ?? 'Invalid Supabase configuration.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('Invalid EXPO_PUBLIC_SUPABASE_URL: expected a full URL such as https://project-ref.supabase.co');
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Invalid EXPO_PUBLIC_SUPABASE_URL: only HTTP(S) URLs are supported.');
  }

  return createClient(parsedUrl.toString().replace(/\/$/, ''), supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase: SupabaseClient | null = configurationError ? null : createSupabaseClient();

export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  const error = getSupabaseConfigurationError();
  if (error) return { success: false, message: error };

  try {
    const response = await fetch(`${supabaseUrl!.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: {
        apikey: supabaseKey!,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: `Supabase responded unsuccessfully (HTTP ${response.status}). Verify the project URL and public key.`,
      };
    }

    return {
      success: true,
      status: response.status,
      message: 'Connected successfully to the Supabase project.',
    };
  } catch {
    return {
      success: false,
      message: 'Network request failed. Check connectivity and EXPO_PUBLIC_SUPABASE_URL.',
    };
  }
}
