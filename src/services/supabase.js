// services/supabase.js - TEMPORARY FOR TESTING
import { createClient } from '@supabase/supabase-js';

// TODO: Move back to .env after testing
const supabaseUrl = 'https://gztcwtcxptpypouowosv.supabase.co';
const supabaseAnonKey = 'sb_publishable_HrB7ZUfnpep15QTofH7n3w_l45iG5J7';

console.log('Using hardcoded Supabase credentials for testing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const auth = supabase.auth;
export const storage = supabase.storage;