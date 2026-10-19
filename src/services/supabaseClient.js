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

// ----------------- Built-in & Local Account Auth System -----------------
const LOCAL_ACCOUNTS_KEY = 'edcalendar_local_accounts_v1';
const LOCAL_SESSION_KEY = 'edcalendar_local_session_v1';

const DEFAULT_ACCOUNTS = [
  {
    id: 'user-godgittipong127',
    email: 'godgittipong127@gmail.com',
    password: 'Godtmrc000',
    name: 'ครูกิตติพงษ์ (Gojji)',
    createdAt: '2026-10-19T00:00:00.000Z',
  },
];

const localAuthListeners = new Set();

function notifyAuthListeners(user) {
  localAuthListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.error('Auth listener error:', err);
    }
  });
}

export function getLocalAccounts() {
  if (typeof window === 'undefined') return [...DEFAULT_ACCOUNTS];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    const map = new Map();
    DEFAULT_ACCOUNTS.forEach((acc) => map.set(acc.email.toLowerCase(), acc));
    if (Array.isArray(stored)) {
      stored.forEach((acc) => {
        if (acc && acc.email) {
          map.set(acc.email.toLowerCase(), acc);
        }
      });
    }
    const merged = Array.from(map.values());
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

function saveLocalAccounts(accounts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save local accounts:', err);
  }
}

export function getLocalSession() {
  if (typeof window === 'undefined') return null;
  try {
    // Ensure default accounts are seeded in localStorage
    getLocalAccounts();
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || null;
  } catch {
    return null;
  }
}

function setLocalSession(user) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(
        LOCAL_SESSION_KEY,
        JSON.stringify({ user, loggedInAt: new Date().toISOString() })
      );
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to persist session:', err);
  }
  notifyAuthListeners(user);
}

export async function getActiveSession() {
  const localUser = getLocalSession();
  if (localUser) return localUser;

  if (!supabase) return null;

  try {
    const health = await checkSupabaseHealth(2000);
    if (!health.ok) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  } catch {
    return null;
  }
}

export function subscribeAuthChanges(callback) {
  localAuthListeners.add(callback);

  let subscription = null;
  if (supabase) {
    const res = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(session.user);
      } else {
        const localUser = getLocalSession();
        callback(localUser || null);
      }
    });
    subscription = res?.data?.subscription;
  }

  return () => {
    localAuthListeners.delete(callback);
    subscription?.unsubscribe();
  };
}

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
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // 1. Check built-in / local accounts first for instant reliable login
  const accounts = getLocalAccounts();
  const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (matched) {
    if (matched.password === password || matched.password === cleanPassword) {
      const sessionUser = {
        id: matched.id || `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
        email: matched.email,
        user_metadata: { name: matched.name || matched.email.split('@')[0] },
        isLocalAccount: true,
      };
      setLocalSession(sessionUser);
      return { user: sessionUser, session: { user: sessionUser } };
    } else {
      throw new Error('Invalid login credentials');
    }
  }

  // 2. If not in local accounts, check if Supabase is online
  if (supabase) {
    const health = await checkSupabaseHealth(2500);
    if (health.ok) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      return data;
    }
  }

  throw new Error('Invalid login credentials');
}

export async function signUpWithEmail(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
  }

  // Save/update in local accounts registry and sign in immediately
  const accounts = getLocalAccounts();
  const existingIdx = accounts.findIndex((acc) => acc.email.toLowerCase() === cleanEmail);
  const newAccount = {
    id: existingIdx >= 0 ? accounts[existingIdx].id : `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
    email: email.trim(),
    password,
    name: existingIdx >= 0 ? accounts[existingIdx].name : email.trim().split('@')[0],
    createdAt: existingIdx >= 0 ? accounts[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = newAccount;
  } else {
    accounts.push(newAccount);
  }
  saveLocalAccounts(accounts);

  const sessionUser = {
    id: newAccount.id,
    email: newAccount.email,
    user_metadata: { name: newAccount.name },
    isLocalAccount: true,
  };
  setLocalSession(sessionUser);

  // Also attempt cloud registration in background if Supabase is reachable
  if (supabase) {
    checkSupabaseHealth(2000)
      .then((health) => {
        if (health.ok) {
          supabase.auth.signUp({ email: cleanEmail, password }).catch(() => {});
        }
      })
      .catch(() => {});
  }

  return { user: sessionUser, session: { user: sessionUser } };
}

export async function resetPasswordForEmail(email, newPassword = '') {
  const cleanEmail = (email || '').trim().toLowerCase();
  const accounts = getLocalAccounts();
  const idx = accounts.findIndex((acc) => acc.email.toLowerCase() === cleanEmail);

  if (idx >= 0 && newPassword) {
    accounts[idx].password = newPassword;
    saveLocalAccounts(accounts);
    return { updated: true };
  }

  if (supabase) {
    const health = await checkSupabaseHealth(2500);
    if (health.ok) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return data;
    }
  }

  if (idx >= 0) {
    return { localAccountFound: true };
  }

  throw new Error('ไม่พบบัญชีอีเมลนี้ในระบบ');
}

export async function signOut() {
  setLocalSession(null);
  if (!supabase) return;
  try {
    const health = await checkSupabaseHealth(1500);
    if (health.ok) {
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore cloud signOut error when offline
  }
}
