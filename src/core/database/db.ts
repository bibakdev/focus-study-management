import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

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
    telegram_topic_link TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_dates (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    persian_date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS group_date_group_id_idx ON group_dates (group_id);

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    in_banana_challenge INTEGER NOT NULL DEFAULT 1,
    active_streak INTEGER NOT NULL DEFAULT 0,
    highest_active_streak INTEGER NOT NULL DEFAULT 0,
    absence_days INTEGER NOT NULL DEFAULT 0,
    consecutive_eggplants INTEGER NOT NULL DEFAULT 0,
    personal_record_minutes INTEGER NOT NULL DEFAULT 0,
    total_checkmarks INTEGER NOT NULL DEFAULT 0,
    total_bananas INTEGER NOT NULL DEFAULT 0,
    total_eggplants INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS study_logs (
    id TEXT PRIMARY KEY NOT NULL,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    group_date_id TEXT NOT NULL REFERENCES group_dates(id) ON DELETE CASCADE,
    study_minutes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS member_group_id_idx ON members (group_id);
  CREATE INDEX IF NOT EXISTS target_member_id_idx ON member_targets (member_id);
  CREATE INDEX IF NOT EXISTS target_group_id_idx ON member_targets (group_id);
  CREATE INDEX IF NOT EXISTS log_member_date_idx ON study_logs (member_id, group_date_id);
`);

const migrations = [
  'ALTER TABLE members ADD COLUMN in_banana_challenge INTEGER NOT NULL DEFAULT 1;',
  'ALTER TABLE members ADD COLUMN absence_days INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN consecutive_eggplants INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN personal_record_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE groups ADD COLUMN telegram_topic_link TEXT;',
  'ALTER TABLE members ADD COLUMN highest_active_streak INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN total_checkmarks INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN total_bananas INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE members ADD COLUMN total_eggplants INTEGER NOT NULL DEFAULT 0;'
];

for (const query of migrations) {
  try {
    expoDb.execSync(query);
  } catch (error) {
    // ستون قبلاً اضافه شده است
  }
}

export const db = drizzle(expoDb, { schema });
