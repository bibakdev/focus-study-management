// src/features/study-room/domain/use-cases/calculate-single-member-stats.ts
import { db } from '@/core/database/db';
import {
  groupDates,
  groups,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { getPersianDateStr, getPersianWeekday } from '@/core/utils/date';
import { asc, eq } from 'drizzle-orm';

export async function calculateSingleMemberStats(
  groupId: string,
  memberId: string
) {
  const groupArr = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  if (groupArr.length === 0) return;
  const group = groupArr[0];

  const memberArr = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);
  if (memberArr.length === 0) return;
  const member = memberArr[0];

  const targetArr = await db
    .select()
    .from(memberTargets)
    .where(eq(memberTargets.memberId, memberId))
    .limit(1);
  const targetData = targetArr.length > 0 ? targetArr[0] : null;

  const dates = await db
    .select()
    .from(groupDates)
    .where(eq(groupDates.groupId, groupId))
    .orderBy(asc(groupDates.persianDate));
  const logs = await db
    .select()
    .from(studyLogs)
    .where(eq(studyLogs.memberId, memberId));

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
  const memberJoinPersian = getPersianDateStr(new Date(member.joinedAt));

  const validDates = dates.filter((d) => {
    return (
      d.persianDate >= memberJoinPersian ||
      logs.some((l) => l.groupDateId === d.id)
    );
  });

  for (let i = 0; i < validDates.length; i++) {
    const date = validDates[i];

    // اگر کاربر در گذشته در این روز مورد بخشودگی قرار گرفته است
    if (
      member.lastForgivenDate &&
      date.persianDate === member.lastForgivenDate
    ) {
      consecutiveEggplants = 0;
      currentlyInChallenge = true;
    }

    const hasLog = logs.find((l) => l.groupDateId === date.id);
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

    // ۱. آپدیت استمرار و غیبت کلی (حتی اگر از چالش حذف شده باشد)
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

    // ۲. آپدیت المان‌های چالش موزی (فقط در صورتی که داخل چالش باشد)
    if (currentlyInChallenge) {
      if (mins >= dailyTarget) {
        totalCheckmarks += 1;
        consecutiveEggplants = 0;
      } else if (mins >= group.bananaThreshold) {
        totalBananas += 1;
        consecutiveEggplants = 0;
      } else {
        totalEggplants += 1;
        consecutiveEggplants += 1;
      }

      // بررسی اخراج شدن
      if (consecutiveEggplants >= group.maxEggplantsAllowed) {
        currentlyInChallenge = false;
      }
    }
  }

  // جلوگیری از باگ روشن نشدن سوییچ:
  // اگر ادمین کاربر را امروز بخشیده اما هنوز لاگی برای امروز باز نشده،
  // سیستم باید مطمئن شود که او به چالش برگشته است.
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

  await db
    .update(members)
    .set({
      isActive,
      absenceDays,
      activeStreak,
      highestActiveStreak,
      personalRecordMinutes,
      totalCheckmarks,
      totalBananas,
      totalEggplants,
      consecutiveEggplants,
      inBananaChallenge: currentlyInChallenge
    })
    .where(eq(members.id, memberId));
}
