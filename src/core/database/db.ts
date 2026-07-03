import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// 🔥 تغییر کلیدی: اضافه شدن enableChangeListener برای فعال‌سازی رفرش خودکار
export const expoDb = openDatabaseSync('focus_sync.db', {
  enableChangeListener: true
});

expoDb.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    banana_threshold INTEGER NOT NULL DEFAULT 120,
    eggplant_threshold INTEGER NOT NULL DEFAULT 30,
    max_eggplants_allowed INTEGER NOT NULL DEFAULT 3,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    in_banana_challenge INTEGER NOT NULL DEFAULT 1,
    active_streak INTEGER NOT NULL DEFAULT 0,
    absence_days INTEGER NOT NULL DEFAULT 0,
    consecutive_eggplants INTEGER NOT NULL DEFAULT 0,
    personal_record_minutes INTEGER NOT NULL DEFAULT 0,
    joined_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS member_targets (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL DEFAULT 'FIXED',
    default_minutes INTEGER NOT NULL DEFAULT 0,
    saturday_minutes INTEGER NOT NULL DEFAULT 0,
    sunday_minutes INTEGER NOT NULL DEFAULT 0,
    monday_minutes INTEGER NOT NULL DEFAULT 0,
    tuesday_minutes INTEGER NOT NULL DEFAULT 0,
    wednesday_minutes INTEGER NOT NULL DEFAULT 0,
    thursday_minutes INTEGER NOT NULL DEFAULT 0,
    friday_minutes INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS member_group_id_idx ON members (group_id);
  CREATE INDEX IF NOT EXISTS target_member_id_idx ON member_targets (member_id);
  CREATE INDEX IF NOT EXISTS target_group_id_idx ON member_targets (group_id);
`);

// مکانیزم Migration برای دیتابیس‌های موجود
const migrations = [
  'ALTER TABLE members ADD COLUMN in_banana_challenge INTEGER NOT NULL DEFAULT 1;',
  'ALTER TABLE members ADD COLUMN absence_days INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN consecutive_eggplants INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN personal_record_minutes INTEGER NOT NULL DEFAULT 0;'
];

for (const query of migrations) {
  try {
    expoDb.execSync(query);
  } catch (error) {
    // ستون قبلاً اضافه شده است
  }
}

export const db = drizzle(expoDb, { schema });
