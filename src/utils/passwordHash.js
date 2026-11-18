// Password hashing helpers (PBKDF2-SHA256 via Web Crypto).
// Passwords are never stored in plain text: accounts keep `passwordSalt` + `passwordHash`.

const ITERATIONS = 100000;
const HASH_BYTES = 32;

function bytesToB64(bytes) {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function generateSalt() {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password, saltB64) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64ToBytes(saltB64), iterations: ITERATIONS },
    key,
    HASH_BYTES * 8
  );
  return bytesToB64(new Uint8Array(bits));
}

/** Returns { passwordSalt, passwordHash } for a new password. */
export async function createPasswordRecord(password) {
  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword(password, passwordSalt);
  return { passwordSalt, passwordHash };
}

/**
 * Verifies a password against an account record.
 * Supports legacy accounts that still hold a plain `password` field (migrated on next save).
 */
export async function verifyAccountPassword(acc, ...candidates) {
  if (!acc) return false;
  const list = candidates.filter((c) => typeof c === 'string' && c.length > 0);
  if (acc.passwordHash && acc.passwordSalt) {
    for (const cand of list) {
      if ((await hashPassword(cand, acc.passwordSalt)) === acc.passwordHash) return true;
    }
    return false;
  }
  return Boolean(acc.password) && list.some((cand) => cand === acc.password);
}

/** Returns a copy of the account with plain `password` replaced by salt + hash. */
export async function withHashedPassword(acc, plainPassword) {
  const { password: legacyPassword, ...rest } = acc || {};
  const plain = plainPassword ?? legacyPassword;
  if (plain) {
    return { ...rest, ...(await createPasswordRecord(plain)) };
  }
  return rest;
}
