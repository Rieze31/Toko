import * as SQLite from 'expo-sqlite';
import { WardrobeItem } from '../types';

const db = SQLite.openDatabaseSync('toko.db');

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS wardrobe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      wears INTEGER DEFAULT 0,
      tag TEXT,
      type TEXT NOT NULL,
      silhouette TEXT NOT NULL,
      color TEXT NOT NULL,
      photo_uri TEXT
    );

    CREATE TABLE IF NOT EXISTS body_photo (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      uri TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tops_id INTEGER,
      bottoms_id INTEGER,
      shoes_id INTEGER,
      outerwear_id INTEGER,
      saved_at TEXT NOT NULL
    );
  `);

  // Add photo_uri column if it doesn't exist (migration)
  try {
    db.execSync('ALTER TABLE wardrobe ADD COLUMN photo_uri TEXT');
  } catch (_) {
    // Column already exists
  }

  // Seed default items if empty
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM wardrobe');
  if (count?.c === 0) {
    const seed: Omit<WardrobeItem, 'id'>[] = [
      { name: 'Linen Shirt',          wears: 12, tag: 'Smart Casual', type: 'tops',      silhouette: 'shirt',   color: '#3B5E8C' },
      { name: 'Raw Denim Jeans',       wears: 28, tag: 'Everyday',     type: 'bottoms',   silhouette: 'trouser', color: '#2A3A50' },
      { name: 'Navy Overshirt',        wears: 7,  tag: 'Layering',     type: 'outerwear', silhouette: 'jacket',  color: '#1A2A4A' },
      { name: 'White Canvas Sneakers', wears: 42, tag: 'Versatile',    type: 'shoes',     silhouette: 'sneaker', color: '#D8D4CC' },
      { name: 'Charcoal Tee',          wears: 19, tag: 'Casual',       type: 'tops',      silhouette: 'shirt',   color: '#3A3A3A' },
      { name: 'Beige Chinos',          wears: 14, tag: 'Smart Casual', type: 'bottoms',   silhouette: 'trouser', color: '#B8A882' },
      { name: 'Merino Crewneck',       wears: 9,  tag: 'Smart Casual', type: 'tops',      silhouette: 'shirt',   color: '#7A4A2A' },
      { name: 'Wool Overcoat',         wears: 4,  tag: 'Formal',       type: 'outerwear', silhouette: 'jacket',  color: '#2A2A2A' },
      { name: 'Derby Shoes',           wears: 11, tag: 'Formal',       type: 'shoes',     silhouette: 'sneaker', color: '#6A4A28' },
      { name: 'Cargo Shorts',          wears: 6,  tag: 'Weekend',      type: 'bottoms',   silhouette: 'trouser', color: '#6A7060' },
    ];
    for (const item of seed) {
      db.runSync(
        'INSERT INTO wardrobe (name, wears, tag, type, silhouette, color) VALUES (?, ?, ?, ?, ?, ?)',
        [item.name, item.wears, item.tag, item.type, item.silhouette, item.color]
      );
    }
  }
}

export function getAllItems(): WardrobeItem[] {
  return db.getAllSync<WardrobeItem>('SELECT * FROM wardrobe ORDER BY wears DESC');
}

export function addItem(item: Omit<WardrobeItem, 'id'>): number {
  const result = db.runSync(
    'INSERT INTO wardrobe (name, wears, tag, type, silhouette, color, photo_uri) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [item.name, item.wears, item.tag, item.type, item.silhouette, item.color, item.photo_uri ?? null]
  );
  return result.lastInsertRowId;
}

export function deleteItem(id: number) {
  db.runSync('DELETE FROM wardrobe WHERE id = ?', [id]);
}

export function updateItemPhoto(id: number, photo_uri: string) {
  db.runSync('UPDATE wardrobe SET photo_uri = ? WHERE id = ?', [photo_uri, id]);
}

export function incrementWears(id: number) {
  db.runSync('UPDATE wardrobe SET wears = wears + 1 WHERE id = ?', [id]);
}

export function saveBodyPhoto(uri: string) {
  db.runSync(
    'INSERT OR REPLACE INTO body_photo (id, uri, updated_at) VALUES (1, ?, ?)',
    [uri, new Date().toISOString()]
  );
}

export function getBodyPhoto(): string | null {
  const row = db.getFirstSync<{ uri: string }>('SELECT uri FROM body_photo WHERE id = 1');
  return row?.uri ?? null;
}

export function saveOutfit(tops?: number, bottoms?: number, shoes?: number, outerwear?: number) {
  db.runSync(
    'INSERT INTO outfits (tops_id, bottoms_id, shoes_id, outerwear_id, saved_at) VALUES (?, ?, ?, ?, ?)',
    [tops ?? null, bottoms ?? null, shoes ?? null, outerwear ?? null, new Date().toISOString()]
  );
}

export function getSavedOutfits(): Array<{
  id: number;
  tops_id: number | null;
  bottoms_id: number | null;
  shoes_id: number | null;
  outerwear_id: number | null;
  saved_at: string;
}> {
  return db.getAllSync('SELECT * FROM outfits ORDER BY saved_at DESC');
}

export function deleteSavedOutfit(id: number) {
  db.runSync('DELETE FROM outfits WHERE id = ?', [id]);
}