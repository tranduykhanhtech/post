import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Article = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  excerpt?: string;
  category?: string;
  views?: number;
  cover_image_url?: string;
  audio_url?: string;
};
