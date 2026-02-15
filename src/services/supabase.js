// services/supabase.js
import { createClient } from '@supabase/supabase-js';

// For development only - replace with your actual credentials when ready
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.warn('Using placeholder Supabase credentials. Create a .env file with real values.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const auth = supabase.auth;
export const storage = supabase.storage;