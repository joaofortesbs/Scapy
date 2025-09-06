import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddatgvruplfcutjwores.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXRndnJ1cGxmY3V0andvcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzQ3NjcsImV4cCI6MjA3MjcxMDc2N30.gkE2EWLU7gvxonWptK_bbiRuAm1d6xIxLVeCYegA5es";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});