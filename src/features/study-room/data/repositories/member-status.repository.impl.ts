import { db } from '@/core/database/db';
import { groupDates, members, studyLogs } from '@/core/database/schema';
import { asc, eq } from 'drizzle-orm';
import { Member } from '../../domain/entities/member';
import { MemberStatusRepository } from '../../domain/repositories/member-status.repository';

export class MemberStatusRepositoryImpl implements MemberStatusRepository {
  async getGroupDataForCalculation(groupId: string) {
    const groupMembers = await db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId));

    // استخراج تاریخ‌ها به ترتیب از قدیمی به جدید برای محاسبه اصولی
    const dates = await db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(asc(groupDates.persianDate));

    // استخراج لاگ‌ها
    const logs = await db
      .select({
        memberId: studyLogs.memberId,
        groupDateId: studyLogs.groupDateId,
        studyMinutes: studyLogs.studyMinutes
      })
      .from(studyLogs)
      .innerJoin(groupDates, eq(studyLogs.groupDateId, groupDates.id))
      .where(eq(groupDates.groupId, groupId));

    return {
      members: groupMembers as unknown as Member[],
      dates,
      logs
    };
  }

  async updateMembersStatus(
    updatedMembers: {
      id: string;
      isActive: boolean;
      absenceDays: number;
      activeStreak: number;
    }[]
  ) {
    // آپدیت کاربران در دیتابیس لوکال
    for (const m of updatedMembers) {
      await db
        .update(members)
        .set({
          isActive: m.isActive,
          absenceDays: m.absenceDays,
          activeStreak: m.activeStreak // همیشه صفر ارسال می‌شود
        })
        .where(eq(members.id, m.id));
    }
  }
}
