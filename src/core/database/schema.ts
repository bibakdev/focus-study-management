import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bananaThreshold: integer('banana_threshold').notNull().default(120),
  eggplantThreshold: integer('eggplant_threshold').notNull().default(30),
  maxEggplantsAllowed: integer('max_eggplants_allowed').notNull().default(3),
  telegramTopicLink: text('telegram_topic_link'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const groupDates = sqliteTable(
  'group_dates',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    persianDate: text('persian_date').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    groupIdIdx: index('group_date_group_id_idx').on(table.groupId)
  })
);

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    inBananaChallenge: integer('in_banana_challenge', { mode: 'boolean' })
      .notNull()
      .default(true),
    activeStreak: integer('active_streak').notNull().default(0),
    absenceDays: integer('absence_days').notNull().default(0),
    consecutiveEggplants: integer('consecutive_eggplants').notNull().default(0),
    personalRecordMinutes: integer('personal_record_minutes')
      .notNull()
      .default(0),
    joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    groupIdIdx: index('member_group_id_idx').on(table.groupId)
  })
);

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
    defaultMinutes: integer('default_minutes').notNull().default(0),
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

export const studyLogs = sqliteTable(
  'study_logs',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    groupDateId: text('group_date_id')
      .notNull()
      .references(() => groupDates.id, { onDelete: 'cascade' }),
    studyMinutes: integer('study_minutes').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
  },
  (table) => ({
    memberDateIdx: index('log_member_date_idx').on(
      table.memberId,
      table.groupDateId
    )
  })
);

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
  targets: many(memberTargets),
  dates: many(groupDates)
}));

export const groupDatesRelations = relations(groupDates, ({ many, one }) => ({
  group: one(groups, { fields: [groupDates.groupId], references: [groups.id] }),
  logs: many(studyLogs)
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  group: one(groups, { fields: [members.groupId], references: [groups.id] }),
  target: one(memberTargets, {
    fields: [members.id],
    references: [memberTargets.memberId]
  }),
  logs: many(studyLogs)
}));

export const studyLogsRelations = relations(studyLogs, ({ one }) => ({
  member: one(members, {
    fields: [studyLogs.memberId],
    references: [members.id]
  }),
  date: one(groupDates, {
    fields: [studyLogs.groupDateId],
    references: [groupDates.id]
  })
}));
