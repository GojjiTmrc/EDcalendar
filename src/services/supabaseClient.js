import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'edcalendar_custom_supabase_url';
const STORAGE_KEY_KEY = 'edcalendar_custom_supabase_anon_key';

// Production Supabase Project credentials provided by user
const DEFAULT_SUPABASE_URL = 'https://jrkuxliltxxdtkusdjmw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bHNVIJpF75KLnZI7wCTjiQ_OJ5LPjvi';

// Read runtime config (prioritize localStorage custom keys, then env variables, then default project)
export function getSupabaseConfig() {
  const customUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
  const customKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_KEY) || '').trim() : '';

  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  ).trim();

  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY
  ).trim();

  const url = customUrl || envUrl;
  const key = customKey || envKey;
  const isCustom = Boolean(customUrl && customKey);

  return { url, key, isCustom, envUrl, envKey };
}

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(
    url &&
    key &&
    !url.includes('your-project')
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

  // Check provider status first to prevent raw 400 black screen
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      const settingsRes = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key },
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings?.external && settings.external.google === false) {
          throw new Error('GOOGLE_PROVIDER_DISABLED');
        }
      }
    } catch (checkErr) {
      if (checkErr.message === 'GOOGLE_PROVIDER_DISABLED') {
        throw new Error('ระบบเข้าสู่ระบบด้วย Google ยังไม่ได้เปิดใช้งานใน Supabase Dashboard (กรุณาไปที่ Authentication > Providers > Google เพื่อเปิดใช้งาน หรือเข้าสู่ระบบด้วยอีเมลแทน)');
      }
      // If network check fails, continue to let OAuth try
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('502') || msg.includes('Bad Gateway') || msg.includes('provider') || msg.includes('disabled')) {
      throw new Error('ระบบเข้าสู่ระบบด้วย Google ยังไม่ได้เปิดใช้งานใน Supabase Dashboard (ไปที่ Authentication > Providers > Google เพื่อเปิด)');
    }
    throw err;
  }
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
