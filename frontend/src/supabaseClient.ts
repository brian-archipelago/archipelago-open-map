import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey);

// Type-safe helper for project operations
export type TypedSupabaseClient = SupabaseClient<Database>;