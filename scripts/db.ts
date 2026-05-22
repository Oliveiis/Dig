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
      (poi_id, name, district, why_worth_it, signature_items, caveats, hook_tag, mention_count, recommendation_count, source_url, crawled_at)
    VALUES
      (@poi_id, @name, @district, @why_worth_it, @signature_items, @caveats, @hook_tag, @mention_count, @recommendation_count, @source_url, @crawled_at)
    ON CONFLICT(poi_id) DO UPDATE SET
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
