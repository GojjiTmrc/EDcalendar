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

export function getSupabaseProjectRef() {
  const { url } = getSupabaseConfig();
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname; // e.g. jrkuxliltxxdtkusdjmw.supabase.co
    const parts = host.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase') {
      return parts[0];
    }
    return '';
  } catch {
    return '';
  }
}

export async function checkSupabaseHealth(timeoutMs = 4000) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { ok: false, reason: 'NOT_CONFIGURED', message: 'ยังไม่ได้ระบุ Supabase URL หรือ Key' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // /auth/v1/health is a lightweight CORS-enabled endpoint on Supabase GoTrue
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: key,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: 'HTTP_ERROR',
      status: res.status,
      message: `เซิร์ฟเวอร์ Supabase ตอบกลับด้วยรหัส ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'UNREACHABLE',
      error: err,
      message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ Supabase ได้ (โปรเจกต์อาจถูกระงับชั่วคราว หรือ DNS ไม่พบ)',
    };
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

  // 1. Proactively test if Supabase server is alive (prevents browser redirecting to Chrome NXDOMAIN error page)
  const health = await checkSupabaseHealth(3500);
  if (!health.ok) {
    throw new Error('SUPABASE_UNREACHABLE');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      try {
        const probeRes = await fetch(data.url, { method: 'GET' });
        if (!probeRes.ok) {
          const errJson = await probeRes.json().catch(() => ({}));
          if (errJson.msg?.includes('missing OAuth secret')) {
            throw new Error('MISSING_OAUTH_SECRET');
          }
          if (errJson.msg?.includes('provider is not enabled')) {
            throw new Error('PROVIDER_DISABLED');
          }
          throw new Error(errJson.msg || 'เกิดข้อผิดพลาดในการตรวจสอบ Google OAuth');
        }
        // If ok, redirect
        window.location.href = data.url;
      } catch (probeErr) {
        if (probeErr.message === 'MISSING_OAUTH_SECRET') {
          throw new Error('ยังไม่ได้ใส่ "Client Secret" ใน Supabase Dashboard (กรุณานำ Client Secret จาก Google Cloud มาใส่ในช่อง Client Secret ของ Supabase แล้วกด Save)');
        }
        if (probeErr.message === 'PROVIDER_DISABLED') {
          throw new Error('ระบบเข้าสู่ระบบด้วย Google ยังไม่ได้เปิดใช้งานใน Supabase Dashboard (กรุณาไปที่ Authentication > Providers > Google เพื่อเปิดใช้งาน)');
        }
        if (probeErr.message && !probeErr.message.includes('fetch') && !probeErr.message.includes('NetworkError')) {
          throw probeErr;
        }
        // Since health check already succeeded, CORS failure on GET means it was successfully redirected to accounts.google.com!
        window.location.href = data.url;
      }
    }
    return data;
  } catch (err) {
    const msg = err.message || '';
    if (msg === 'SUPABASE_UNREACHABLE') {
      throw err;
    }
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
