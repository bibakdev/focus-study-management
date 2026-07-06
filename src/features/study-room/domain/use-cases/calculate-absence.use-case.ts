// src/features/study-room/domain/use-cases/calculate-absence.use-case.ts
import { getPersianDateStr, getPersianWeekday } from '@/core/utils/date';
import { MemberStatusRepository } from '../repositories/member-status.repository';

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
      let consecutiveEggplants = 0;
      let isActive = true;

      let currentlyInChallenge = !member.isManualOptOut;
      const targetData = targets.find((t) => t.memberId === member.id);
      const memberJoinPersian = getPersianDateStr(new Date(member.joinedAt));

      const validDates = dates.filter((d) => {
        return (
          d.persianDate >= memberJoinPersian ||
          logs.some((l) => l.memberId === member.id && l.groupDateId === d.id)
        );
      });

      for (const date of validDates) {
        if (
          member.lastForgivenDate &&
          date.persianDate === member.lastForgivenDate
        ) {
          consecutiveEggplants = 0;
          currentlyInChallenge = true;
        }

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

        if (dailyTarget === 0) {
          activeStreak = 0;
          absenceDays = 0;
          isActive = true;
          continue;
        }

        // ۱. آپدیت استمرار و غیبت کلی
        if (mins >= dailyTarget) {
          absenceDays = 0;
          activeStreak += 1;
          highestActiveStreak = Math.max(highestActiveStreak, activeStreak);
          isActive = true;
        } else if (mins > 0) {
          absenceDays = 0;
          activeStreak = 0;
          isActive = true;
        } else {
          absenceDays += 1;
          activeStreak = 0;
          isActive = false;
        }

        // ۲. آپدیت المان‌های چالش
        if (currentlyInChallenge) {
          if (mins >= dailyTarget) {
            totalCheckmarks += 1;
            consecutiveEggplants = 0;
          } else if (mins >= bananaThreshold) {
            totalBananas += 1;
            consecutiveEggplants = 0;
          } else {
            totalEggplants += 1;
            consecutiveEggplants += 1;
          }

          if (consecutiveEggplants >= group.maxEggplantsAllowed) {
            currentlyInChallenge = false;
          }
        }
      }

      const lastProcessedDate =
        validDates.length > 0
          ? validDates[validDates.length - 1].persianDate
          : null;
      if (
        member.lastForgivenDate &&
        (!lastProcessedDate || member.lastForgivenDate > lastProcessedDate)
      ) {
        currentlyInChallenge = true;
        consecutiveEggplants = 0;
      }

      if (member.isManualOptOut) {
        currentlyInChallenge = false;
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
        totalEggplants,
        inBananaChallenge: currentlyInChallenge
      };
    });

    await this.repository.updateMembersStatus(updatedMembers);
  }
}
