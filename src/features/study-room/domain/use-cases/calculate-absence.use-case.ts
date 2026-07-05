import { getPersianWeekday } from '@/core/utils/date';
import { MemberStatusRepository } from '../repositories/member-status.repository';

export class CalculateAbsenceUseCase {
  constructor(private readonly repository: MemberStatusRepository) {}

  async execute(groupId: string): Promise<void> {
    const { members, dates, logs, targets } =
      await this.repository.getGroupDataForCalculation(groupId);

    if (dates.length === 0) return;

    const updatedMembers = members.map((member) => {
      let absenceDays = 0;
      let activeStreak = 0;
      let highestActiveStreak = 0;
      let isActive = true;

      const targetData = targets.find((t) => t.memberId === member.id);

      for (const date of dates) {
        const hasLog = logs.find(
          (l) => l.memberId === member.id && l.groupDateId === date.id
        );
        const mins = hasLog ? hasLog.studyMinutes : 0;

        let dailyTarget = 120;
        if (targetData) {
          if (targetData.targetType === 'FIXED') {
            dailyTarget = targetData.defaultMinutes;
          } else {
            const wd = getPersianWeekday(date.persianDate);
            switch (wd) {
              case 'شنبه':
                dailyTarget = targetData.saturdayMinutes;
                break;
              case 'یکشنبه':
                dailyTarget = targetData.sundayMinutes;
                break;
              case 'دوشنبه':
                dailyTarget = targetData.mondayMinutes;
                break;
              case 'سه‌شنبه':
                dailyTarget = targetData.tuesdayMinutes;
                break;
              case 'چهارشنبه':
                dailyTarget = targetData.wednesdayMinutes;
                break;
              case 'پنج‌شنبه':
                dailyTarget = targetData.thursdayMinutes;
                break;
              case 'جمعه':
                dailyTarget = targetData.fridayMinutes;
                break;
            }
          }
        }

        if (mins >= dailyTarget) {
          // دریافت ✅ (رسیدن به تارگت)
          absenceDays = 0;
          activeStreak += 1;
          highestActiveStreak = Math.max(highestActiveStreak, activeStreak);
          isActive = true;
        } else if (mins > 0) {
          // دریافت 🍌 یا 🍆 (تایم زده اما کمتر از تارگت)
          absenceDays = 0;
          activeStreak = 0;
          isActive = true;
        } else {
          // دریافت ❌ (غیبت کامل)
          absenceDays += 1;
          activeStreak = 0;
          isActive = false;
        }
      }

      return {
        id: member.id,
        isActive,
        absenceDays,
        activeStreak,
        highestActiveStreak
      };
    });

    await this.repository.updateMembersStatus(updatedMembers);
  }
}
