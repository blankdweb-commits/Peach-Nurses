// services/supabase.js
import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key
// These should be in your .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Using placeholder values.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const auth = supabase.auth;
export const storage = supabase.storage;