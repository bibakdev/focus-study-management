import { Member } from '../entities/member';

export interface MemberStatusRepository {
  getGroupDataForCalculation(groupId: string): Promise<{
    members: Member[];
    dates: { id: string; persianDate: string }[];
    logs: { memberId: string; groupDateId: string; studyMinutes: number }[];
  }>;
  updateMembersStatus(
    members: {
      id: string;
      isActive: boolean;
      absenceDays: number;
      activeStreak: number;
    }[]
  ): Promise<void>;
}
