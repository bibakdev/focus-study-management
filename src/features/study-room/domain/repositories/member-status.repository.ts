import { Group } from '../entities/group';
import { Member, MemberTarget } from '../entities/member';

export interface MemberStatusRepository {
  getGroupDataForCalculation(groupId: string): Promise<{
    group: Group | null;
    members: Member[];
    dates: { id: string; persianDate: string }[];
    logs: { memberId: string; groupDateId: string; studyMinutes: number }[];
    targets: MemberTarget[];
  }>;
  updateMembersStatus(
    members: {
      id: string;
      isActive: boolean;
      absenceDays: number;
      activeStreak: number;
      highestActiveStreak: number;
      personalRecordMinutes: number;
      totalCheckmarks: number;
      totalBananas: number;
      totalEggplants: number;
    }[]
  ): Promise<void>;
}
