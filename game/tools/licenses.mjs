// License rules for the shareable build, and the reader for design/ASSET_SOURCES.csv.
// A file ships only when its row says commercial_use "yes" and names a license that allows commercial use.

// Minimal CSV reader (handles quoted fields). Returns one object per row, keyed by the header names.
export function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

const unresolved = /^(|tbd|unknown|todo|\?|n\/a|none)$/i;
const notCommercial = /\bNC\b|non-?commercial|reference/i;
const yes = (v) => String(v || '').trim().toLowerCase() === 'yes';

// Why a file can't ship, in plain words, or '' when it can.
export function excludeReason(row) {
  if (!row) return 'no row in design/ASSET_SOURCES.csv';
  const lic = String(row.license || '').trim();
  if (!yes(row.commercial_use)) return `commercial_use is "${row.commercial_use || 'blank'}"; it must be "yes"`;
  if (unresolved.test(lic)) return `license is "${lic || 'blank'}"; it must name the license`;
  if (notCommercial.test(lic)) return `license "${lic}" is non-commercial or reference-only`;
  return '';
}
export function cleared(row) { return !excludeReason(row); }
export function needsCredit(row) { return !!row && yes(row.attribution_required); }

// A ready-to-paste design/ASSET_SOURCES.csv line for a file that has no row yet. Pure: it never writes the CSV.
// filePath is like 'assets/characters/character-sammy/sammy-run-strip-v02.png'.
// If a row exists for another version of the same file, its creator, source and license columns are copied;
// otherwise license is TBD and commercial_use is blank, so the file will not ship until someone fills them in.
export const CSV_COLUMNS = ['asset_id', 'path', 'creator', 'source_url', 'license', 'commercial_use', 'attribution_required', 'notes'];
const withoutVersion = (p) => String(p).replace(/^\.?\//, '').replace(/-v\d+(-[a-z0-9]+)?\.[a-z0-9]+$/i, '');
const verNum = (p) => { const m = /-v(\d+)(-[a-z0-9]+)?\.[a-z0-9]+$/i.exec(String(p)); return m ? parseInt(m[1], 10) : -1; };
const csvField = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
export function suggestRow(filePath, rows = []) {
  const key = withoutVersion(filePath);
  const older = rows.filter((r) => r.path && withoutVersion(r.path) === key && r.path.replace(/^\.?\//, '') !== filePath)
    .sort((a, b) => verNum(a.path) - verNum(b.path) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)).pop();
  const row = {
    asset_id: key.split('/').pop(), path: filePath, creator: '', source_url: '', license: 'TBD',
    commercial_use: '', attribution_required: '', notes: 'New file; check every column',
  };
  if (older) {
    for (const k of ['creator', 'source_url', 'license', 'commercial_use', 'attribution_required']) row[k] = older[k] || '';
    row.notes = 'Copied from ' + older.path + '; check it still applies';
  }
  return CSV_COLUMNS.map((k) => (k === 'notes' ? '"' + row.notes.replace(/"/g, '""') + '"' : csvField(row[k]))).join(',');
}
