// services/supabase.js
import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key
// These should be in your .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.error('Supabase URL or Anon Key is missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment variables.');
}

// Create Supabase client (only if configured, otherwise use dummy to prevent immediate crash)
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co',
  supabaseAnonKey || 'missing-key'
);

export const SUPABASE_CONFIGURED = isConfigured;

// Helper functions for common operations
export const auth = supabase.auth;
export const storage = supabase.storage;