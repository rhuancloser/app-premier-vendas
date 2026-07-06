import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvqlgvfocpjhxvhgsymn.supabase.co';
const supabaseAnonKey = 'sb_publishable_G2E797iejx3Nd0E-TmhPZA_m7y_7EuG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
