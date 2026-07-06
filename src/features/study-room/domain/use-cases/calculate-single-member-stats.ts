import { db } from '@/core/database/db';
import {
  groupDates,
  groups,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { getPersianWeekday } from '@/core/utils/date';
import { asc, eq } from 'drizzle-orm';

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

  // وضعیت اولیه شرکت در چالش
  let inBananaChallenge =
    member.inBananaChallenge === true || member.inBananaChallenge === 1;
  const memberJoinPersian = getPersianDateStr(new Date(member.joinedAt));

  const validDates = dates.filter((d) => {
    return (
      d.persianDate >= memberJoinPersian ||
      logs.some((l) => l.groupDateId === d.id)
    );
  });

  for (let i = 0; i < validDates.length; i++) {
    const date = validDates[i];
    const isLastDate = i === validDates.length - 1;

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

    if (mins >= dailyTarget) {
      absenceDays = 0;
      activeStreak += 1;
      highestActiveStreak = Math.max(highestActiveStreak, activeStreak);
      isActive = true;
      totalCheckmarks += 1;
      consecutiveEggplants = 0;
    } else if (mins > 0) {
      absenceDays = 0;
      activeStreak = 0;
      isActive = true;

      if (mins >= group.bananaThreshold) {
        totalBananas += 1;
        consecutiveEggplants = 0;
      } else {
        totalEggplants += 1;
        consecutiveEggplants += 1;
      }
    } else {
      absenceDays += 1;
      activeStreak = 0;
      isActive = false;
      totalEggplants += 1;
      consecutiveEggplants += 1;
    }

    if (consecutiveEggplants >= group.maxEggplantsAllowed) {
      if (member.inBananaChallenge) {
        // اگر ادمین دستی روشن کرده باشد
        if (isLastDate) {
          inBananaChallenge = false; // امروز حذف شد
        } else {
          consecutiveEggplants = 0; // در گذشته حذف شده بوده اما ادمین بخشیده
        }
      }
    }
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
      inBananaChallenge
    })
    .where(eq(members.id, memberId));
}
