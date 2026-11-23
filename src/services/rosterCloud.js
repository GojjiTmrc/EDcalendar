import { CLOUD_FIRESTORE_BASE_URL } from './supabaseClient';

// Cloud storage for student rosters: one Firestore document per account, in its own
// collection (separate from the calendar document so rosters never touch calendar data).

const COLLECTION = 'edcalendar_rosters';

function toSafeDocId(userId) {
  return String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** Returns { rosters, exists } or null when the cloud could not be reached. */
export async function fetchCloudRosters(userId, timeoutMs = 5000) {
  const docId = toSafeDocId(userId);
  if (!docId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/${COLLECTION}/${docId}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.status === 404) return { rosters: {}, exists: false };
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.fields?.rosterJson?.stringValue;
    if (!raw) return { rosters: {}, exists: false };
    const parsed = JSON.parse(raw);
    return { rosters: parsed && typeof parsed === 'object' ? parsed : {}, exists: true };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function pushCloudRosters(userId, rosters, timeoutMs = 6000) {
  const docId = toSafeDocId(userId);
  if (!docId) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/${COLLECTION}/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          userId: { stringValue: String(userId) },
          rosterJson: { stringValue: JSON.stringify(rosters) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
