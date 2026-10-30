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

export function getAccountUsername(acc) {
  if (!acc) return '';
  if (acc.username && String(acc.username).trim()) {
    return String(acc.username).trim();
  }
  const email = String(acc.email || '').trim();
  return email.includes('@') ? email.split('@')[0] : email;
}

function normalizeAccountRecord(acc) {
  if (!acc || !acc.email) return null;
  const email = String(acc.email).trim();
  const username = getAccountUsername(acc);
  const docId = emailToAccountDocId(email);
  return {
    ...acc,
    id: acc.id || `user-${docId}`,
    email,
    username,
    name: acc.name || username || email.split('@')[0],
  };
}

function matchesAccountIdentifier(acc, identifier) {
  const clean = String(identifier || '').trim().toLowerCase();
  if (!clean || !acc) return false;
  const accEmail = String(acc.email || '').trim().toLowerCase();
  const accUsername = getAccountUsername(acc).toLowerCase();
  const emailPrefix = accEmail.includes('@') ? accEmail.split('@')[0] : accEmail;
  return (
    accEmail === clean ||
    (accUsername && accUsername === clean) ||
    (emailPrefix && emailPrefix === clean)
  );
}

function parseCloudAccountFields(f) {
  if (!f || !f.email?.stringValue) return null;
  const email = String(f.email.stringValue).trim();
  const docId = emailToAccountDocId(email);
  const fallbackUsername = email.includes('@') ? email.split('@')[0] : email;
  const username = String(f.username?.stringValue || fallbackUsername).trim();
  return normalizeAccountRecord({
    id: f.id?.stringValue || `user-${docId}`,
    email,
    username,
    password: f.password?.stringValue || '',
    name: f.name?.stringValue || username || fallbackUsername,
    teacherName: f.teacherName?.stringValue || '',
    schoolName: f.schoolName?.stringValue || '',
    academicRole: f.academicRole?.stringValue || '',
    updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
  });
}

async function fetchAllCloudAccounts(timeoutMs = 2500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_accounts`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    const docs = Array.isArray(json?.documents) ? json.documents : [];
    const byEmail = new Map();
    docs.forEach((doc) => {
      const parsed = parseCloudAccountFields(doc?.fields);
      if (parsed && parsed.email) {
        const key = parsed.email.toLowerCase();
        const existing = byEmail.get(key);
        if (!existing || (parsed.username && !existing.username)) {
          byEmail.set(key, parsed);
        }
      }
    });
    return Array.from(byEmail.values());
  } catch {
    return [];
  }
}

async function fetchCloudAccount(identifier, timeoutMs = 2500) {
  const clean = String(identifier || '').trim().toLowerCase();
  const docId = emailToAccountDocId(clean);
  if (!docId) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_accounts/${docId}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const parsed = parseCloudAccountFields(json?.fields);
      if (parsed) return parsed;
    }
  } catch {
    // Continue to collection lookup fallback
  }

  // Fallback: search all cloud account records by email, username, or email prefix
  const allCloud = await fetchAllCloudAccounts(timeoutMs);
  return allCloud.find((acc) => matchesAccountIdentifier(acc, clean)) || null;
}

async function saveCloudAccount(account, timeoutMs = 3000) {
  const normalized = normalizeAccountRecord(account);
  if (!normalized || !normalized.email) return;

  const emailDocId = emailToAccountDocId(normalized.email);
  const usernameDocId = emailToAccountDocId(normalized.username);
  const nowIso = new Date().toISOString();

  const body = {
    fields: {
      id: { stringValue: String(normalized.id || `user-${emailDocId}`) },
      email: { stringValue: String(normalized.email).trim() },
      username: { stringValue: String(normalized.username).trim() },
      password: { stringValue: String(normalized.password || '') },
      name: { stringValue: String(normalized.name || normalized.username) },
      teacherName: { stringValue: String(normalized.teacherName || '') },
      schoolName: { stringValue: String(normalized.schoolName || '') },
      academicRole: { stringValue: String(normalized.academicRole || '') },
      updatedAt: { stringValue: nowIso },
    },
  };

  const docIds = Array.from(new Set([emailDocId, usernameDocId].filter(Boolean)));

  await Promise.all(
    docIds.map(async (docId) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
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
    })
  );
}

// ----------------- Built-in & Local Account Auth System -----------------
const LOCAL_ACCOUNTS_KEY = 'edcalendar_local_accounts_v1';
const LOCAL_SESSION_KEY = 'edcalendar_local_session_v1';

const DEFAULT_ACCOUNTS = [
  {
    id: 'user-godgittipong127',
    email: 'godgittipong127@gmail.com',
    username: 'godgittipong127',
    password: 'Godtmrc000',
    name: 'ครูกิตติพงษ์ (Gojji)',
    createdAt: '2026-10-19T00:00:00.000Z',
  },
  {
    id: 'user-tlegx2gmailcom',
    email: 'tlegx2@gmail.com',
    username: 'tlegx2',
    password: '450450450.',
    name: 'tlegx2',
    createdAt: '2026-10-19T05:07:07.560Z',
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
    DEFAULT_ACCOUNTS.forEach((acc) => {
      const norm = normalizeAccountRecord(acc);
      if (norm) map.set(norm.email.toLowerCase(), norm);
    });
    if (Array.isArray(stored)) {
      stored.forEach((acc) => {
        if (acc && acc.email && acc.email.toLowerCase() !== 'godgiitpong127@gmail.com') {
          const key = acc.email.toLowerCase();
          const existing = map.get(key);
          const norm = normalizeAccountRecord({
            ...existing,
            ...acc,
            username: acc.username || existing?.username || getAccountUsername(acc),
          });
          if (norm) map.set(key, norm);
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
  const norm = normalizeAccountRecord(acc);
  if (!norm || !norm.email) return;
  const accounts = getLocalAccounts();
  const cleanEmail = norm.email.toLowerCase();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    accounts[idx] = normalizeAccountRecord({ ...accounts[idx], ...norm });
  } else {
    accounts.push(norm);
  }
  saveLocalAccounts(accounts);
}

function buildSessionUser(acc) {
  const norm = normalizeAccountRecord(acc);
  const cleanEmail = String(norm?.email || '').trim().toLowerCase();
  const username = getAccountUsername(norm);
  if (typeof window !== 'undefined') {
    if (norm?.teacherName) localStorage.setItem('edcalendar_teacher_name', norm.teacherName);
    if (norm?.schoolName) localStorage.setItem('edcalendar_school_name', norm.schoolName);
    if (norm?.academicRole) localStorage.setItem('edcalendar_academic_role', norm.academicRole);
  }
  return {
    id: norm?.id || `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
    email: norm?.email || '',
    username,
    teacherName: norm?.teacherName || '',
    schoolName: norm?.schoolName || '',
    academicRole: norm?.academicRole || '',
    user_metadata: {
      name: norm?.name || username,
      username,
      teacherName: norm?.teacherName || '',
      schoolName: norm?.schoolName || '',
      academicRole: norm?.academicRole || '',
    },
    isCloudAccount: true,
  };
}

export function getLocalSession() {
  if (typeof window === 'undefined') return null;
  try {
    const accounts = getLocalAccounts();
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sessionUser = parsed?.user || null;
    if (!sessionUser) return null;

    if (!sessionUser.username) {
      const matched = accounts.find(
        (a) =>
          (sessionUser.id && a.id === sessionUser.id) ||
          (sessionUser.email && a.email.toLowerCase() === sessionUser.email.toLowerCase())
      );
      const resolvedUsername = matched
        ? getAccountUsername(matched)
        : getAccountUsername(sessionUser);
      sessionUser.username = resolvedUsername;
      sessionUser.user_metadata = {
        ...(sessionUser.user_metadata || {}),
        username: resolvedUsername,
      };
    }
    return sessionUser;
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
export async function signInWithEmail(identifier, password) {
  const cleanIdentifier = (identifier || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanIdentifier || !password) {
    throw new Error('กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน');
  }

  // 1. Check Cloud Account Registry first (supports both Email and Username across devices)
  const cloudAcc = await fetchCloudAccount(cleanIdentifier, 2500);
  if (cloudAcc) {
    upsertLocalAccount(cloudAcc);
    if (cloudAcc.password === password || cloudAcc.password === cleanPassword) {
      const sessionUser = buildSessionUser(cloudAcc);
      saveCloudAccount(cloudAcc);
      setLocalSession(sessionUser);
      return { user: sessionUser, session: { user: sessionUser } };
    }
  }

  // 2. Check built-in / local accounts cache (matches email, username, or email prefix)
  const accounts = getLocalAccounts();
  const matched = accounts.find((acc) => matchesAccountIdentifier(acc, cleanIdentifier));

  if (matched) {
    if (matched.password === password || matched.password === cleanPassword) {
      const sessionUser = buildSessionUser(matched);
      // Ensure account & username index are synced to cloud registry
      saveCloudAccount(matched);
      setLocalSession(sessionUser);
      return { user: sessionUser, session: { user: sessionUser } };
    } else {
      throw new Error('Invalid login credentials');
    }
  }

  // 3. Check Supabase if online
  if (supabase) {
    const targetEmail = cleanIdentifier.includes('@')
      ? cleanIdentifier
      : matched?.email || cloudAcc?.email || '';

    if (targetEmail && targetEmail.includes('@')) {
      const health = await checkSupabaseHealth(2500);
      if (health.ok) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        if (error) throw error;
        return data;
      }
    }
  }

  throw new Error('Invalid login credentials');
}

export async function signUpWithEmail(email, password, username = '') {
  const rawEmail = String(email || '').trim();
  const cleanEmail = rawEmail.toLowerCase();
  const rawUsername = String(username || '').trim();
  const cleanUsername = rawUsername.toLowerCase();

  if (!cleanEmail || !cleanUsername || !password) {
    throw new Error('กรุณากรอกอีเมล ชื่อผู้ใช้ (Username) และรหัสผ่านให้ครบถ้วน');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawEmail)) {
    throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
  }

  if (rawUsername.length < 3) {
    throw new Error('ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
  }

  if (/\s/.test(rawUsername) || rawUsername.includes('@')) {
    throw new Error('ชื่อผู้ใช้ (Username) ห้ามมีช่องว่างหรือเครื่องหมาย @');
  }

  // Pull latest cloud accounts to strictly enforce 1 Email = 1 ID and 1 Username = 1 ID
  const [cloudList, directByEmail, directByUsername] = await Promise.all([
    fetchAllCloudAccounts(2500),
    fetchCloudAccount(cleanEmail, 2000),
    fetchCloudAccount(cleanUsername, 2000),
  ]);

  cloudList.forEach((acc) => upsertLocalAccount(acc));
  if (directByEmail) upsertLocalAccount(directByEmail);
  if (directByUsername) upsertLocalAccount(directByUsername);

  const accounts = getLocalAccounts();

  // Check if Email is already registered (1 Email = 1 ID)
  const emailExists = accounts.some(
    (acc) => String(acc.email || '').trim().toLowerCase() === cleanEmail
  );
  if (emailExists) {
    throw new Error('อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว (1 อีเมลสามารถสมัครได้เพียง 1 บัญชีเท่านั้น)');
  }

  // Check if Username is already taken (1 Username = 1 ID)
  const usernameExists = accounts.some((acc) => {
    const accUser = getAccountUsername(acc).toLowerCase();
    const accPrefix = String(acc.email || '').trim().toLowerCase().split('@')[0];
    return accUser === cleanUsername || accPrefix === cleanUsername;
  });
  if (usernameExists) {
    throw new Error('ชื่อผู้ใช้นี้ (Username) มีผู้ใช้งานแล้ว กรุณาตั้งชื่อผู้ใช้อื่น');
  }

  const newAccount = normalizeAccountRecord({
    id: `user-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
    email: rawEmail,
    username: rawUsername,
    password,
    name: rawUsername,
    createdAt: new Date().toISOString(),
  });

  upsertLocalAccount(newAccount);
  await saveCloudAccount(newAccount);

  const sessionUser = buildSessionUser(newAccount);
  setLocalSession(sessionUser);

  // Also attempt Supabase registration in background if reachable
  if (supabase) {
    checkSupabaseHealth(2000)
      .then((health) => {
        if (health.ok) {
          supabase.auth
            .signUp({
              email: cleanEmail,
              password,
              options: { data: { username: rawUsername, name: rawUsername } },
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  return { user: sessionUser, session: { user: sessionUser } };
}

export async function resetPasswordForEmail(identifier, newPassword = '') {
  const cleanIdentifier = (identifier || '').trim().toLowerCase();
  if (!cleanIdentifier) {
    throw new Error('กรุณากรอกอีเมลหรือชื่อผู้ใช้');
  }

  const cloudAcc = await fetchCloudAccount(cleanIdentifier, 2500);
  if (cloudAcc) {
    upsertLocalAccount(cloudAcc);
  }

  const accounts = getLocalAccounts();
  const idx = accounts.findIndex((acc) => matchesAccountIdentifier(acc, cleanIdentifier));

  if (idx >= 0 && newPassword) {
    accounts[idx].password = newPassword;
    saveLocalAccounts(accounts);
    await saveCloudAccount(accounts[idx]);
    return { updated: true };
  }

  if (supabase && cleanIdentifier.includes('@')) {
    const health = await checkSupabaseHealth(2500);
    if (health.ok) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanIdentifier, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return data;
    }
  }

  if (idx >= 0) {
    return { localAccountFound: true };
  }

  throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ (กรุณาตรวจสอบอีเมลหรือชื่อผู้ใช้)');
}

export async function updateAccountProfile({
  userId,
  email,
  newUsername,
  displayName,
  teacherName,
  schoolName,
  academicRole,
  newPassword,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const rawUsername = String(newUsername || '').trim();
  const cleanUsername = rawUsername.toLowerCase();

  if (!rawUsername || rawUsername.length < 3) {
    throw new Error('ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
  }
  if (/\s/.test(rawUsername) || rawUsername.includes('@')) {
    throw new Error('ชื่อผู้ใช้ (Username) ห้ามมีช่องว่างหรือเครื่องหมาย @');
  }

  // Pull cloud accounts to ensure username uniqueness across all users
  const cloudList = await fetchAllCloudAccounts(2500);
  cloudList.forEach((acc) => upsertLocalAccount(acc));

  const accounts = getLocalAccounts();
  const currentIdx = accounts.findIndex(
    (acc) =>
      (userId && acc.id === userId) ||
      (cleanEmail && String(acc.email || '').trim().toLowerCase() === cleanEmail)
  );

  // Check if another user already uses this username
  const duplicateOther = accounts.some((acc, idx) => {
    if (idx === currentIdx) return false;
    if (userId && acc.id === userId) return false;
    if (cleanEmail && String(acc.email || '').trim().toLowerCase() === cleanEmail) return false;
    const accUser = getAccountUsername(acc).toLowerCase();
    const accPrefix = String(acc.email || '').trim().toLowerCase().split('@')[0];
    return accUser === cleanUsername || accPrefix === cleanUsername;
  });

  if (duplicateOther) {
    throw new Error('ชื่อผู้ใช้นี้ (Username) มีผู้ใช้งานแล้ว กรุณาตั้งชื่อผู้ใช้อื่น');
  }

  const existing = currentIdx >= 0 ? accounts[currentIdx] : { id: userId, email };
  const oldUsername = getAccountUsername(existing);

  const updatedAccount = normalizeAccountRecord({
    ...existing,
    username: rawUsername,
    name: String(displayName || rawUsername).trim(),
    teacherName: teacherName !== undefined ? String(teacherName).trim() : existing.teacherName || '',
    schoolName: schoolName !== undefined ? String(schoolName).trim() : existing.schoolName || '',
    academicRole: academicRole !== undefined ? String(academicRole).trim() : existing.academicRole || '',
    password: newPassword ? newPassword : existing.password,
    updatedAt: new Date().toISOString(),
  });

  if (currentIdx >= 0) {
    accounts[currentIdx] = updatedAccount;
    saveLocalAccounts(accounts);
  } else {
    upsertLocalAccount(updatedAccount);
  }

  // Remove old username doc on Firestore if username changed and isn't the email docId
  const oldDocId = emailToAccountDocId(oldUsername);
  const newDocId = emailToAccountDocId(rawUsername);
  const emailDocId = emailToAccountDocId(updatedAccount.email);
  if (oldDocId && oldDocId !== newDocId && oldDocId !== emailDocId) {
    try {
      await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_accounts/${oldDocId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore delete error if offline
    }
  }

  await saveCloudAccount(updatedAccount);

  const sessionUser = buildSessionUser(updatedAccount);
  setLocalSession(sessionUser);
  return sessionUser;
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
