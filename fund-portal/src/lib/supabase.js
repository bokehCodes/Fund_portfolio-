import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const missingVariables = [
  !url && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

export const configError = missingVariables.length
  ? `Missing ${missingVariables.join(' / ')}. Add them in Vercel > Settings > Environment Variables, then redeploy.`
  : null

export const supabase = configError ? null : createClient(url, anonKey)
