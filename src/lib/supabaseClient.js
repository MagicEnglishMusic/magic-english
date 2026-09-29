import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://magic-english.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.magicenglish_anon_key_placeholder';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY &&
  !env.VITE_SUPABASE_URL.includes('placeholder') &&
  !env.VITE_SUPABASE_URL.includes('seu-projeto') &&
  !env.VITE_SUPABASE_URL.includes('magic-english.supabase.co') &&
  !env.VITE_SUPABASE_ANON_KEY.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
