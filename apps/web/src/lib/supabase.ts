import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grmlmouqkixvfxbdifrc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_YwJ2C4fMCIPvItB8EVarhQ_iTFqu9o5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
