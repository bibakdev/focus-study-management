import { getPersianWeekday } from '@/core/utils/date';
import { MemberStatusRepository } from '../repositories/member-status.repository';

const getPersianDateStr = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      calendar: 'persian',
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value.padStart(2, '0');
    const day = parts.find((p) => p.type === 'day')?.value.padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (e) {
    return '1400/01/01';
  }
};

export class CalculateAbsenceUseCase {
  constructor(private readonly repository: MemberStatusRepository) {}

  async execute(groupId: string): Promise<void> {
    const { group, members, dates, logs, targets } =
      await this.repository.getGroupDataForCalculation(groupId);

    if (dates.length === 0 || !group) return;

    const bananaThreshold = group.bananaThreshold;

    const updatedMembers = members.map((member) => {
      let absenceDays = 0;
      let activeStreak = 0;
      let highestActiveStreak = 0;
      let personalRecordMinutes = 0;
      let totalCheckmarks = 0;
      let totalBananas = 0;
      let totalEggplants = 0;
      let isActive = true;

      const targetData = targets.find((t) => t.memberId === member.id);
      const isChallenging =
        member.inBananaChallenge === true || member.inBananaChallenge === 1;

      const memberJoinPersian = getPersianDateStr(new Date(member.joinedAt));

      // فقط روزهایی که از تاریخ عضویت به بعد بوده‌اند یا در آن‌ها لاگ ثبت شده محاسبه می‌شوند
      const validDates = dates.filter((d) => {
        return (
          d.persianDate >= memberJoinPersian ||
          logs.some((l) => l.memberId === member.id && l.groupDateId === d.id)
        );
      });

      for (const date of validDates) {
        const hasLog = logs.find(
          (l) => l.memberId === member.id && l.groupDateId === date.id
        );
        const mins = hasLog ? hasLog.studyMinutes : 0;

        personalRecordMinutes = Math.max(personalRecordMinutes, mins);

        let dailyTarget = 0;
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

        if (!isChallenging || dailyTarget === 0) {
          activeStreak = 0;
          absenceDays = 0;
          isActive = true;
          continue;
        }

        if (mins >= dailyTarget) {
          absenceDays = 0;
          activeStreak += 1;
          highestActiveStreak = Math.max(highestActiveStreak, activeStreak);
          isActive = true;

          totalCheckmarks += 1;
        } else if (mins > 0) {
          absenceDays = 0;
          activeStreak = 0;
          isActive = true;

          if (mins >= bananaThreshold) {
            totalBananas += 1;
          } else {
            totalEggplants += 1;
          }
        } else {
          absenceDays += 1;
          activeStreak = 0;
          isActive = false;

          totalEggplants += 1; // 0 دقیقه هم یک بادمجان محسوب می‌شود
        }
      }

      return {
        id: member.id,
        isActive,
        absenceDays,
        activeStreak,
        highestActiveStreak,
        personalRecordMinutes,
        totalCheckmarks,
        totalBananas,
        totalEggplants
      };
    });

    await this.repository.updateMembersStatus(updatedMembers);
  }
}
