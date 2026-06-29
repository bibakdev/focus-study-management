import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ۱. جدول گروه‌ها (Tenants)
export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bananaThreshold: integer('banana_threshold').notNull().default(120), // حد نصاب موز به دقیقه (مثلا ۲ ساعت)
  eggplantThreshold: integer('eggplant_threshold').notNull().default(30), // حداقل زمان بادمجون به دقیقه
  maxEggplantsAllowed: integer('max_eggplants_allowed').notNull().default(3), // سقف بادمجون متوالی برای حذف
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ۲. جدول اعضا
export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    activeStreak: integer('active_streak').notNull().default(0), // روزهای متوالی فعالیت
    absenceDays: integer('absence_days').notNull().default(0), // روزهای غیبت (برای افراد غیرفعال)
    consecutiveEggplants: integer('consecutive_eggplants').notNull().default(0), // بادمجون‌های متوالی
    personalRecordMinutes: integer('personal_record_minutes')
      .notNull()
      .default(0), // رکورد بالاترین ساعت مطالعه
    joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    groupIdIdx: index('member_group_id_idx').on(table.groupId) // ایندکس حیاتی برای Multi-Tenancy
  })
);

// ۳. جدول تارگت‌های منعطف اعضا
export const memberTargets = sqliteTable(
  'member_targets',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['FIXED', 'WEEKLY'] })
      .notNull()
      .default('FIXED'),
    defaultMinutes: integer('default_minutes').notNull().default(0), // تارگت ثابت روزانه
    saturdayMinutes: integer('saturday_minutes').notNull().default(0),
    sundayMinutes: integer('sunday_minutes').notNull().default(0),
    mondayMinutes: integer('monday_minutes').notNull().default(0),
    tuesdayMinutes: integer('tuesday_minutes').notNull().default(0),
    wednesdayMinutes: integer('wednesday_minutes').notNull().default(0),
    thursdayMinutes: integer('thursday_minutes').notNull().default(0),
    fridayMinutes: integer('friday_minutes').notNull().default(0)
  },
  (table) => ({
    memberIdIdx: index('target_member_id_idx').on(table.memberId),
    groupIdIdx: index('target_group_id_idx').on(table.groupId)
  })
);

// --- روابط (Relations) برای استفاده راحت در کانتینرها ---

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
  targets: many(memberTargets)
}));

export const membersRelations = relations(members, ({ learns, one }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id]
  }),
  target: one(memberTargets, {
    fields: [members.id],
    references: [memberTargets.memberId]
  })
}));
