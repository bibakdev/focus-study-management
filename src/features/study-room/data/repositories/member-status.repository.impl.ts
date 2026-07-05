import { db } from '@/core/database/db';
import {
  groupDates,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { asc, eq } from 'drizzle-orm';
import { Member, MemberTarget } from '../../domain/entities/member';
import { MemberStatusRepository } from '../../domain/repositories/member-status.repository';

export class MemberStatusRepositoryImpl implements MemberStatusRepository {
  async getGroupDataForCalculation(groupId: string) {
    const groupMembers = await db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId));

    const dates = await db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(asc(groupDates.persianDate));

    const logs = await db
      .select({
        memberId: studyLogs.memberId,
        groupDateId: studyLogs.groupDateId,
        studyMinutes: studyLogs.studyMinutes
      })
      .from(studyLogs)
      .innerJoin(groupDates, eq(studyLogs.groupDateId, groupDates.id))
      .where(eq(groupDates.groupId, groupId));

    const targets = await db
      .select()
      .from(memberTargets)
      .where(eq(memberTargets.groupId, groupId));

    return {
      members: groupMembers as unknown as Member[],
      dates,
      logs,
      targets: targets as unknown as MemberTarget[]
    };
  }

  async updateMembersStatus(
    updatedMembers: {
      id: string;
      isActive: boolean;
      absenceDays: number;
      activeStreak: number;
      highestActiveStreak: number;
    }[]
  ) {
    for (const m of updatedMembers) {
      await db
        .update(members)
        .set({
          isActive: m.isActive,
          absenceDays: m.absenceDays,
          activeStreak: m.activeStreak,
          highestActiveStreak: m.highestActiveStreak
        })
        .where(eq(members.id, m.id));
    }
  }
}
