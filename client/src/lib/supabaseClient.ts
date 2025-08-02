import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your-project-id.supabase.co' || supabaseUrl.includes('your-project-id')) {
  throw new Error(
    'Missing or invalid VITE_SUPABASE_URL environment variable. ' +
    'Please set it to your actual Supabase project URL in your Netlify environment variables. ' +
    `Current value: ${supabaseUrl || 'undefined'}`
  );
}

if (!supabaseKey || supabaseKey === 'your-anon-public-key-here' || supabaseKey.length < 100) {
  throw new Error(
    'Missing or invalid VITE_SUPABASE_KEY environment variable. ' +
    'Please set it to your actual Supabase anon key in your Netlify environment variables. ' +
    `Current value: ${supabaseKey ? '[REDACTED - length: ' + supabaseKey.length + ']' : 'undefined'}`
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. ` +
    'It should be in the format: https://your-project-id.supabase.co'
  );
}

console.log('Supabase client initialized with URL:', supabaseUrl);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);