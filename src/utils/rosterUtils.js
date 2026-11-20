// Helpers for student rosters: parsing pasted/CSV/Excel data, column mapping,
// display names, CSV export and random draw utilities.

export const COLUMN_ROLES = [
  { value: 'ignore', label: 'ไม่ใช้คอลัมน์นี้' },
  { value: 'number', label: 'เลขที่' },
  { value: 'studentCode', label: 'รหัสนักเรียน' },
  { value: 'prefix', label: 'คำนำหน้า' },
  { value: 'firstName', label: 'ชื่อ' },
  { value: 'lastName', label: 'นามสกุล' },
  { value: 'fullName', label: 'ชื่อ-นามสกุล (ช่องเดียว)' },
  { value: 'nickname', label: 'ชื่อเล่น' },
];

const PREFIXES = [
  'เด็กชาย',
  'เด็กหญิง',
  'ด.ช.',
  'ด.ญ.',
  'ดช.',
  'ดญ.',
  'นางสาว',
  'น.ส.',
  'นส.',
  'นาย',
  'นาง',
  'master',
  'miss',
  'mrs.',
  'mr.',
  'ms.',
].sort((a, b) => b.length - a.length);

/** Split a leading title (นาย, เด็กชาย, ...) from a name. */
export function stripPrefix(text) {
  const raw = String(text ?? '').trim();
  const lower = raw.toLowerCase();
  for (const p of PREFIXES) {
    if (lower.startsWith(p.toLowerCase()) && raw.length > p.length) {
      const rest = raw.slice(p.length).replace(/^[\s.]+/, '');
      if (rest) return { prefix: raw.slice(0, p.length), rest };
    }
  }
  return { prefix: '', rest: raw };
}

/** Split "ชื่อ นามสกุล" at the first run of whitespace. */
export function splitFullName(text) {
  const raw = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return { firstName: '', lastName: '' };
  const idx = raw.indexOf(' ');
  if (idx < 0) return { firstName: raw, lastName: '' };
  return { firstName: raw.slice(0, idx), lastName: raw.slice(idx + 1) };
}

/** Parse pasted text / CSV into a 2D array of strings (quotes + tab/comma/semicolon aware). */
export function parseDelimitedText(input) {
  const text = String(input ?? '').replace(/^﻿/, '');
  if (!text.trim()) return [];

  const firstLines = text.split(/\r?\n/).slice(0, 8).join('\n');
  let delimiter = null;
  if (firstLines.includes('\t')) {
    delimiter = '\t';
  } else {
    const commas = (firstLines.match(/,/g) || []).length;
    const semis = (firstLines.match(/;/g) || []).length;
    if (commas > 0 || semis > 0) delimiter = commas >= semis ? ',' : ';';
  }

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const pushRow = () => {
    pushCell();
    if (row.some((c) => c !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      inQuotes = true;
    } else if (delimiter && ch === delimiter) {
      pushCell();
    } else if (ch === '\n') {
      pushRow();
    } else if (ch === '\r') {
      // ignore (handled with \n)
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) pushRow();
  return rows;
}

/** Make every row the same width and every cell a trimmed string. */
export function normalizeRows(rows) {
  const clean = (rows || []).map((r) =>
    (Array.isArray(r) ? r : [r]).map((c) => {
      if (c === null || c === undefined) return '';
      if (c instanceof Date) return c.toISOString().slice(0, 10);
      return String(c).trim();
    })
  );
  const width = clean.reduce((m, r) => Math.max(m, r.length), 0);
  return clean
    .map((r) => [...r, ...Array(Math.max(0, width - r.length)).fill('')])
    .filter((r) => r.some((c) => c !== ''));
}

function guessRoleFromHeader(text) {
  const t = String(text || '').toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  if (/(ชื่อ.?-?.?สกุล|ชื่อ.?นามสกุล|fullname|nameandsurname|ชื่อ-นามสกุล)/.test(t)) return 'fullName';
  if (/(นามสกุล|สกุล|lastname|surname|familyname)/.test(t)) return 'lastName';
  if (/(เล่น|nick)/.test(t)) return 'nickname';
  if (/(รหัส|studentid|studentcode|^id$)/.test(t)) return 'studentCode';
  if (/(คำนำหน้า|prefix|title)/.test(t)) return 'prefix';
  if (/^(เลขที่|ที่|no\.?|number|ลำดับ|ลำดับที่|#)$/.test(t)) return 'number';
  if (/^(ชื่อ|ชื่อจริง|firstname|name|ชื่อนักเรียน)$/.test(t)) return 'firstName';
  return null;
}

/** Roles guessed from one header row (array of roles, duplicates reduced to 'ignore'). */
export function guessColumnsFromHeader(headerRow) {
  const used = new Set();
  return (headerRow || []).map((cell) => {
    const role = guessRoleFromHeader(cell);
    if (!role || used.has(role)) return 'ignore';
    used.add(role);
    return role;
  });
}

/** Find the header row within the first rows (needs >= 1 recognised name column). Returns -1 if none. */
export function detectHeaderRow(rows) {
  const limit = Math.min(rows.length, 15);
  for (let i = 0; i < limit; i += 1) {
    const roles = guessColumnsFromHeader(rows[i]);
    const hasName = roles.some((r) => r === 'firstName' || r === 'fullName');
    const matched = roles.filter((r) => r !== 'ignore').length;
    if (hasName && (matched >= 2 || rows[i].filter(Boolean).length === 1)) return i;
  }
  return -1;
}

/** Guess roles when there is no header row, from the look of the data. */
export function guessColumnsFromData(rows) {
  const width = rows[0]?.length || 0;
  if (width === 0) return [];
  if (width === 1) return ['fullName'];
  const sample = rows.slice(0, 10);
  const isNumeric = (c) => /^\d{1,3}$/.test(c);
  const roles = Array(width).fill('ignore');
  let col = 0;
  if (sample.every((r) => isNumeric(r[0]))) {
    roles[0] = 'number';
    col = 1;
  }
  if (col < width) {
    const hasSpace = sample.some((r) => /\s/.test(r[col] || ''));
    if (hasSpace || width - col === 1) {
      roles[col] = 'fullName';
    } else {
      roles[col] = 'firstName';
      if (col + 1 < width) roles[col + 1] = 'lastName';
    }
  }
  return roles;
}

let idCounter = 0;
function newStudentId() {
  idCounter += 1;
  return `stu-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 5)}`;
}

export function createStudent(partial = {}) {
  return {
    id: partial.id || newStudentId(),
    number: String(partial.number ?? '').trim(),
    studentCode: String(partial.studentCode ?? '').trim(),
    prefix: String(partial.prefix ?? '').trim(),
    firstName: String(partial.firstName ?? '').trim(),
    lastName: String(partial.lastName ?? '').trim(),
    nickname: String(partial.nickname ?? '').trim(),
  };
}

/**
 * Build students from rows using a column->role mapping.
 * options: { headerRowIndex (-1 = none), stripPrefixes, splitFullNames }
 */
export function buildStudents(rows, roles, options = {}) {
  const { headerRowIndex = -1, stripPrefixes = true, splitFullNames = true } = options;
  const dataRows = rows.slice(headerRowIndex + 1);
  const students = [];

  dataRows.forEach((row) => {
    const get = (role) => {
      const idx = roles.indexOf(role);
      return idx >= 0 ? String(row[idx] ?? '').trim() : '';
    };

    let prefix = get('prefix');
    let firstName = get('firstName');
    let lastName = get('lastName');
    const full = get('fullName');

    if (full && !firstName) {
      let rest = full;
      if (stripPrefixes) {
        const sp = stripPrefix(rest);
        if (!prefix) prefix = sp.prefix;
        rest = sp.rest;
      }
      if (splitFullNames) {
        const parts = splitFullName(rest);
        firstName = parts.firstName;
        if (!lastName) lastName = parts.lastName;
      } else {
        firstName = rest;
      }
    } else if (firstName && stripPrefixes && !prefix) {
      const sp = stripPrefix(firstName);
      prefix = sp.prefix;
      firstName = sp.rest;
    }

    if (!firstName && !lastName) return;

    let number = get('number');
    if (!number) number = String(students.length + 1);

    students.push(
      createStudent({
        number,
        studentCode: get('studentCode'),
        prefix,
        firstName,
        lastName,
        nickname: get('nickname'),
      })
    );
  });

  return students;
}

/** Names appearing more than once (full name), used for warnings. */
export function findDuplicateNames(students) {
  const seen = new Map();
  students.forEach((s) => {
    const key = `${s.firstName} ${s.lastName}`.trim().toLowerCase();
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  return [...seen.entries()].filter(([, n]) => n > 1).map(([name]) => name);
}

export function sortStudents(students) {
  return [...students].sort((a, b) => {
    const na = parseInt(a.number, 10);
    const nb = parseInt(b.number, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'th');
  });
}

export const DISPLAY_MODES = [
  { value: 'nickname', label: 'ชื่อเล่น (ไม่มีใช้ชื่อจริง)' },
  { value: 'first', label: 'ชื่อจริง' },
  { value: 'full', label: 'ชื่อ-นามสกุล' },
  { value: 'number', label: 'เลขที่' },
];

/** Text shown on the big screen for a student. */
export function displayName(student, mode = 'nickname', hideSurname = false) {
  if (!student) return '';
  const first = student.firstName || '';
  const last = student.lastName || '';
  switch (mode) {
    case 'number':
      return `เลขที่ ${student.number || '-'}`;
    case 'first':
      return first || last;
    case 'full': {
      const lastShown = hideSurname && last ? `${last.slice(0, 1)}.` : last;
      return `${first} ${lastShown}`.trim();
    }
    case 'nickname':
    default:
      return student.nickname || first || last;
  }
}

/** Full name for the management table / exports. */
export function fullDisplayName(student) {
  return `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim();
}

export function rosterToCsv(students) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['เลขที่', 'รหัสนักเรียน', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น'];
  const lines = [header.join(',')];
  students.forEach((s) => {
    lines.push(
      [s.number, s.studentCode, s.prefix, s.firstName, s.lastName, s.nickname].map(esc).join(',')
    );
  });
  return `﻿${lines.join('\r\n')}`;
}

// ---------------------------------------------------------------------------
// Random utilities (uniform, crypto based)
// ---------------------------------------------------------------------------

export function secureRandomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
  if (!cryptoObj?.getRandomValues) return Math.floor(Math.random() * maxExclusive);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  do {
    cryptoObj.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % maxExclusive;
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Split students into groups.
 * mode 'count' -> value = number of groups, 'size' -> value = people per group.
 * method 'random' | 'mixed' (mixed = deal in roll-number order so each group spreads across the list)
 */
export function makeGroups(students, { mode = 'count', value = 4, method = 'random' } = {}) {
  const n = students.length;
  if (n === 0) return [];
  const v = Math.max(1, Math.floor(Number(value) || 1));
  const groupCount = mode === 'size' ? Math.ceil(n / v) : Math.min(v, n);
  const ordered = method === 'mixed' ? sortStudents(students) : shuffle(students);
  const groups = Array.from({ length: groupCount }, () => []);
  ordered.forEach((s, i) => {
    groups[i % groupCount].push(s);
  });
  return groups;
}
