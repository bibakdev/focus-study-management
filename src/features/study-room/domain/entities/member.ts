export interface Member {
  id: string;
  groupId: string;
  name: string;
  isActive: boolean;
  inBananaChallenge: boolean;
  activeStreak: number;
  highestActiveStreak: number;
  absenceDays: number;
  consecutiveEggplants: number;
  personalRecordMinutes: number;
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
