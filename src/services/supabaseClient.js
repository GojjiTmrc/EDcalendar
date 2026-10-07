import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'edcalendar_custom_supabase_url';
const STORAGE_KEY_KEY = 'edcalendar_custom_supabase_anon_key';

// Read runtime config (prioritize localStorage custom keys, then env variables)
export function getSupabaseConfig() {
  const customUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
  const customKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_KEY) || '').trim() : '';

  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  const url = customUrl || envUrl;
  const key = customKey || envKey;
  const isCustom = Boolean(customUrl && customKey);

  return { url, key, isCustom, envUrl, envKey };
}

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  // Validates presence and filters out known placeholders or non-existent templates
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !url.includes('jrkuxliltxxdtkusdjmw')
  );
};

export function saveCustomSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem(STORAGE_URL_KEY, url.trim());
      localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
    window.location.reload();
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
    window.location.reload();
  }
}

function initSupabase() {
  const { url, key } = getSupabaseConfig();
  if (isSupabaseConfigured()) {
    try {
      return createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Supabase initialization failed:', err);
      return null;
    }
  }
  return null;
}

export const supabase = initSupabase();

// Auth helper functions
export async function signInWithGoogle() {
  if (!supabase) throw new Error('ยังไม่ได้กำหนดค่า Supabase URL และ Key');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('ยังไม่ได้กำหนดค่า Supabase URL และ Key');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error('ยังไม่ได้กำหนดค่า Supabase URL และ Key');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email) {
  if (!supabase) throw new Error('ยังไม่ได้กำหนดค่า Supabase URL และ Key');
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
