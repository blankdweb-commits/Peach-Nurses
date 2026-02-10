// services/supabase.js
import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key
// These should be in your .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const auth = supabase.auth;
export const storage = supabase.storage;