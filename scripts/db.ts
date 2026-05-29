import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/dig.db');

let _db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS poi_enrichments (
      poi_id              TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      district            TEXT,
      why_worth_it        TEXT,
      signature_items     TEXT,
      caveats             TEXT,
      hook_tag            TEXT,
      mention_count       INTEGER DEFAULT 0,
      recommendation_count INTEGER DEFAULT 0,
      source_url          TEXT,
      crawled_at          TEXT NOT NULL
    );
  `);

  // Idempotent additive migration — SQLite has no IF NOT EXISTS for ALTER TABLE.
  const existing = new Set(
    (_db.prepare(`PRAGMA table_info(poi_enrichments)`).all() as { name: string }[]).map(r => r.name)
  );
  const additions: [string, string][] = [
    ['name_norm', 'TEXT'],
    ['district_norm', 'TEXT'],
    ['raw_xhs_notes', 'TEXT'],
    ['raw_reddit_posts', 'TEXT'],
    ['raw_openrice', 'TEXT'],
    ['summary_status', `TEXT DEFAULT 'pending'`],
    ['summary_model', 'TEXT'],
    ['summarized_at', 'TEXT'],
  ];
  for (const [col, type] of additions) {
    if (!existing.has(col)) _db.exec(`ALTER TABLE poi_enrichments ADD COLUMN ${col} ${type};`);
  }

  _db.exec(`CREATE INDEX IF NOT EXISTS idx_poi_name_district ON poi_enrichments(name_norm, district_norm);`);

  // Backfill name_norm / district_norm for any pre-existing row that doesn't have them.
  const needBackfill = _db
    .prepare(`SELECT poi_id, name, district FROM poi_enrichments WHERE name_norm IS NULL OR district_norm IS NULL`)
    .all() as { poi_id: string; name: string; district: string | null }[];
  if (needBackfill.length > 0) {
    const upd = _db.prepare(
      `UPDATE poi_enrichments SET name_norm = ?, district_norm = ? WHERE poi_id = ?`
    );
    const tx = _db.transaction((rows: typeof needBackfill) => {
      for (const r of rows) upd.run(normalizeName(r.name), normalizeName(r.district ?? ''), r.poi_id);
    });
    tx(needBackfill);
  }

  return _db;
}

export interface POIEnrichment {
  poi_id: string;
  name: string;
  district: string;
  why_worth_it: string | null;
  signature_items: string[];
  caveats: string[];
  hook_tag: string;
  mention_count: number;
  recommendation_count: number;
  source_url: string;
  crawled_at: string;
}

export function upsertEnrichment(e: POIEnrichment): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO poi_enrichments
      (poi_id, name, district, name_norm, district_norm, why_worth_it, signature_items, caveats, hook_tag, mention_count, recommendation_count, source_url, crawled_at)
    VALUES
      (@poi_id, @name, @district, @name_norm, @district_norm, @why_worth_it, @signature_items, @caveats, @hook_tag, @mention_count, @recommendation_count, @source_url, @crawled_at)
    ON CONFLICT(poi_id) DO UPDATE SET
      name                 = excluded.name,
      district             = excluded.district,
      name_norm            = excluded.name_norm,
      district_norm        = excluded.district_norm,
      why_worth_it         = excluded.why_worth_it,
      signature_items      = excluded.signature_items,
      caveats              = excluded.caveats,
      hook_tag             = excluded.hook_tag,
      mention_count        = excluded.mention_count,
      recommendation_count = excluded.recommendation_count,
      source_url           = excluded.source_url,
      crawled_at           = excluded.crawled_at
  `).run({
    ...e,
    name_norm: normalizeName(e.name),
    district_norm: normalizeName(e.district ?? ''),
    signature_items: JSON.stringify(e.signature_items),
    caveats: JSON.stringify(e.caveats),
  });
}

export function getEnrichment(poi_id: string): Omit<POIEnrichment, 'crawled_at'> | null {
  const db = getDB();
  const row = db.prepare('SELECT * FROM poi_enrichments WHERE poi_id = ?').get(poi_id) as any;
  if (!row) return null;
  return {
    ...row,
    signature_items: JSON.parse(row.signature_items || '[]'),
    caveats: JSON.parse(row.caveats || '[]'),
  };
}

export function hasEnrichment(poi_id: string): boolean {
  const db = getDB();
  const row = db.prepare('SELECT 1 FROM poi_enrichments WHERE poi_id = ?').get(poi_id);
  return !!row;
}

// Normalize a POI name or district for fuzzy matching.
// Lowercase, strip whitespace + punctuation + common suffixes (香港 / hong kong / hk / 店).
// Also unify simplified ↔ traditional via a small known map (kept tiny on purpose — extend as needed).
const ZH_S2T: Record<string, string> = {
  '环': '環', '园': '園', '岛': '島', '台': '臺', '号': '號', '厅': '廳',
  '区': '區', '边': '邊', '门': '門', '间': '間', '湾': '灣', '坚': '堅',
};
export function normalizeName(s: string): string {
  if (!s) return '';
  let out = s.toLowerCase();
  out = out.replace(/[!-/:-@[-`{-~　-〿＀-￯]/g, '');
  out = out.replace(/\s+/g, '');
  out = out.replace(/(香港|hongkong|hk|店|分店|餐廳|餐厅|cafe|restaurant|bar)$/g, '');
  let unified = '';
  for (const ch of out) unified += ZH_S2T[ch] ?? ch;
  return unified;
}

export interface RawNotesSource {
  source: 'xhs' | 'reddit' | 'openrice';
  notes: any;
}

export function upsertRawNotes(
  poiId: string,
  meta: { name: string; district: string },
  source: RawNotesSource['source'],
  notes: any,
): void {
  const db = getDB();
  const col = source === 'xhs' ? 'raw_xhs_notes' : source === 'reddit' ? 'raw_reddit_posts' : 'raw_openrice';
  const exists = db.prepare('SELECT 1 FROM poi_enrichments WHERE poi_id = ?').get(poiId);
  const payload = JSON.stringify(notes ?? []);
  if (exists) {
    db.prepare(`UPDATE poi_enrichments SET ${col} = ?, name_norm = ?, district_norm = ? WHERE poi_id = ?`)
      .run(payload, normalizeName(meta.name), normalizeName(meta.district), poiId);
  } else {
    db.prepare(`
      INSERT INTO poi_enrichments
        (poi_id, name, district, name_norm, district_norm, ${col}, summary_status, signature_items, caveats, hook_tag, crawled_at)
      VALUES
        (?, ?, ?, ?, ?, ?, 'pending', '[]', '[]', '', ?)
    `).run(
      poiId,
      meta.name,
      meta.district,
      normalizeName(meta.name),
      normalizeName(meta.district),
      payload,
      new Date().toISOString(),
    );
  }
}

export interface PendingRow {
  poi_id: string;
  name: string;
  district: string | null;
  raw_xhs_notes: string | null;
  raw_reddit_posts: string | null;
  raw_openrice: string | null;
}

export function listPendingForSummary(): PendingRow[] {
  const db = getDB();
  return db.prepare(`
    SELECT poi_id, name, district, raw_xhs_notes, raw_reddit_posts, raw_openrice
    FROM poi_enrichments
    WHERE COALESCE(summary_status, 'pending') = 'pending'
      AND (
        (raw_xhs_notes IS NOT NULL AND raw_xhs_notes != '[]') OR
        (raw_reddit_posts IS NOT NULL AND raw_reddit_posts != '[]') OR
        (raw_openrice IS NOT NULL AND raw_openrice != '[]')
      )
  `).all() as PendingRow[];
}

export function markNoData(poiId: string): void {
  const db = getDB();
  db.prepare(`UPDATE poi_enrichments SET summary_status = 'no_data' WHERE poi_id = ?`).run(poiId);
}

export interface SummaryUpdate {
  hook_tag: string;
  why_worth_it: string;
  signature_items: string[];
  caveats: string[];
  recommendation_count?: number | null;
  mention_count?: number | null;
  model: string;
}

export function updateSummary(poiId: string, s: SummaryUpdate): void {
  const db = getDB();
  db.prepare(`
    UPDATE poi_enrichments
    SET hook_tag = ?,
        why_worth_it = ?,
        signature_items = ?,
        caveats = ?,
        recommendation_count = COALESCE(?, recommendation_count),
        mention_count = COALESCE(?, mention_count),
        summary_status = 'done',
        summary_model = ?,
        summarized_at = ?
    WHERE poi_id = ?
  `).run(
    s.hook_tag,
    s.why_worth_it,
    JSON.stringify(s.signature_items),
    JSON.stringify(s.caveats),
    s.recommendation_count ?? null,
    s.mention_count ?? null,
    s.model,
    new Date().toISOString(),
    poiId,
  );
}

export interface EnrichmentLookup {
  poi_id: string;
  name: string;
  district: string | null;
  hook_tag: string | null;
  why_worth_it: string | null;
  signature_items: string[];
  caveats: string[];
  recommendation_count: number | null;
  mention_count: number | null;
  source_url: string | null;
  summary_status: string;
  summarized_at: string | null;
}

function rowToLookup(row: any): EnrichmentLookup {
  return {
    poi_id: row.poi_id,
    name: row.name,
    district: row.district,
    hook_tag: row.hook_tag || null,
    why_worth_it: row.why_worth_it,
    signature_items: row.signature_items ? JSON.parse(row.signature_items) : [],
    caveats: row.caveats ? JSON.parse(row.caveats) : [],
    recommendation_count: row.recommendation_count,
    mention_count: row.mention_count,
    source_url: row.source_url,
    summary_status: row.summary_status ?? 'pending',
    summarized_at: row.summarized_at,
  };
}

// Fuzzy lookup by (name, district). Strict (name_norm, district_norm) match first;
// if no district given OR no match, fall back to name_norm match alone but reject ambiguous (>1 row).
export function findEnrichmentByNameDistrict(
  name: string,
  district: string,
): EnrichmentLookup | null {
  const db = getDB();
  const nn = normalizeName(name);
  const dn = normalizeName(district);
  if (!nn) return null;

  if (dn) {
    const exact = db.prepare(`SELECT * FROM poi_enrichments WHERE name_norm = ? AND district_norm = ?`).all(nn, dn) as any[];
    if (exact.length === 1) return rowToLookup(exact[0]);
    if (exact.length > 1) return null;
  }

  const byName = db.prepare(`SELECT * FROM poi_enrichments WHERE name_norm = ?`).all(nn) as any[];
  if (byName.length === 1) return rowToLookup(byName[0]);
  return null;
}

export function slugForPOI(name: string, district: string): string {
  return `crawl-${normalizeName(name)}__${normalizeName(district)}`;
}
