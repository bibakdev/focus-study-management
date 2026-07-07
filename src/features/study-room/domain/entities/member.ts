// src/features/study-room/domain/entities/member.ts
export interface Member {
  id: string;
  groupId: string;
  name: string;
  isActive: boolean;
  inBananaChallenge: boolean;
  inGroupChallenge: boolean;
  isManualOptOut?: boolean;
  lastForgivenDate?: string | null;
  activeStreak: number;
  highestActiveStreak: number;
  absenceDays: number;
  consecutiveEggplants: number;
  personalRecordMinutes: number;
  totalCheckmarks: number;
  totalBananas: number;
  totalEggplants: number;
  teamFirstPlaces: number;
  teamSecondPlaces: number;
  teamThirdPlaces: number;
  teamChampionships: number;
  joinedAt: Date;
}

export type TargetType = 'FIXED' | 'WEEKLY';

export interface MemberTarget {
  id: string;
  memberId: string;
  groupId: string;
  targetType: TargetType;
  defaultMinutes: number;
  saturdayMinutes: number;
  sundayMinutes: number;
  mondayMinutes: number;
  tuesdayMinutes: number;
  wednesdayMinutes: number;
  thursdayMinutes: number;
  fridayMinutes: number;
}

export interface MemberWithTarget extends Member {
  target: MemberTarget | null;
}
