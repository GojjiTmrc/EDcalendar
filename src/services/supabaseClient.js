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

// ----------------- Always-On Cloud Realtime Sync Engine (Google Cloud Firestore) -----------------
export const CLOUD_FIRESTORE_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/gojji-lyrics-hub/databases/(default)/documents';

function emailToAccountDocId(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
}

async function fetchCloudAccount(email, timeoutMs = 2500) {
  const docId = emailToAccountDocId(email);
  if (!docId) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_accounts/${docId}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const f = json?.fields;
    if (!f || !f.email?.stringValue) return null;
    return {
      id: f.id?.stringValue || `user-${docId}`,
      email: f.email.stringValue,
      password: f.password?.stringValue || '',
      name: f.name?.stringValue || f.email.stringValue.split('@')[0],
      updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function saveCloudAccount(account, timeoutMs = 3000) {
  if (!account || !account.email) return;
  const docId = emailToAccountDocId(account.email);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const body = {
      fields: {
        id: { stringValue: String(account.id || `user-${docId}`) },
        email: { stringValue: String(account.email).trim() },
        password: { stringValue: String(account.password || '') },
        name: { stringValue: String(account.name || account.email.split('@')[0]) },
        updatedAt: { stringValue: new Date().toISOString() },
      },
    };
    await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_accounts/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Fallback to local if offline
  }
}

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
        if (acc && acc.email && acc.email.toLowerCase() !== 'godgiitpong127@gmail.com') {
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

function upsertLocalAccount(acc) {
  if (!acc || !acc.email) return;
  const accounts = getLocalAccounts();
  const cleanEmail = acc.email.toLowerCase();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...acc };
  } else {
    accounts.push(acc);
  }
  saveLocalAccounts(accounts);
}

export function getLocalSession() {
  if (typeof window === 'undefined') return null;
  try {
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

  // Listen to cross-tab login/logout changes via storage event
  const handleStorageEvent = (e) => {
    if (e.key === LOCAL_SESSION_KEY) {
      const nextUser = getLocalSession();
      callback(nextUser || null);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

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
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
    subscription?.unsubscribe();
  };
}

// Auth helper functions
export async function signInWithEmail(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // 1. Check Cloud Account Registry first (enables cross-device login & password changes)
  const cloudAcc = await fetchCloudAccount(cleanEmail, 2500);
  if (cloudAcc) {
    upsertLocalAccount(cloudAcc);
    if (cloudAcc.password === password || cloudAcc.password === cleanPassword) {
      const sessionUser = {
        id: cloudAcc.id || `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
        email: cloudAcc.email,
        user_metadata: { name: cloudAcc.name || cloudAcc.email.split('@')[0] },
        isCloudAccount: true,
      };
      setLocalSession(sessionUser);
      return { user: sessionUser, session: { user: sessionUser } };
    }
  }

  // 2. Check built-in / local accounts cache
  const accounts = getLocalAccounts();
  const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (matched) {
    if (matched.password === password || matched.password === cleanPassword) {
      const sessionUser = {
        id: matched.id || `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
        email: matched.email,
        user_metadata: { name: matched.name || matched.email.split('@')[0] },
        isCloudAccount: true,
      };
      // Ensure account is also synced to cloud registry
      saveCloudAccount(matched);
      setLocalSession(sessionUser);
      return { user: sessionUser, session: { user: sessionUser } };
    } else {
      throw new Error('Invalid login credentials');
    }
  }

  // 3. Check Supabase if online
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

  const isGojjiAlias = cleanEmail === 'godgittipong127@gmail.com';

  const accounts = getLocalAccounts();
  const existingIdx = accounts.findIndex((acc) => acc.email.toLowerCase() === cleanEmail);
  const newAccount = {
    id: isGojjiAlias
      ? 'user-godgittipong127'
      : existingIdx >= 0
      ? accounts[existingIdx].id
      : `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
    email: email.trim(),
    password,
    name: existingIdx >= 0 ? accounts[existingIdx].name : email.trim().split('@')[0],
    createdAt: existingIdx >= 0 ? accounts[existingIdx].createdAt : new Date().toISOString(),
  };

  upsertLocalAccount(newAccount);
  await saveCloudAccount(newAccount);

  const sessionUser = {
    id: newAccount.id,
    email: newAccount.email,
    user_metadata: { name: newAccount.name },
    isCloudAccount: true,
  };
  setLocalSession(sessionUser);

  // Also attempt Supabase registration in background if reachable
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
  const cloudAcc = await fetchCloudAccount(cleanEmail, 2500);
  if (cloudAcc) {
    upsertLocalAccount(cloudAcc);
  }

  const accounts = getLocalAccounts();
  const idx = accounts.findIndex((acc) => acc.email.toLowerCase() === cleanEmail);

  if (idx >= 0 && newPassword) {
    accounts[idx].password = newPassword;
    saveLocalAccounts(accounts);
    await saveCloudAccount(accounts[idx]);
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
