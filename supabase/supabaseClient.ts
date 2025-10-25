import { createClient } from '@supabase/supabase-js'

// ✅ Securely read from environment variables (Vercel or .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

