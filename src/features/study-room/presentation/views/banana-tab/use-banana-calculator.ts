import { db } from '@/core/database/db';
import {
  groupDates,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { getPersianWeekday } from '@/core/utils/date';
import { asc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Group } from '../../../domain/entities/group';
import { Member } from '../../../domain/entities/member';
import { RankingItem } from '../../components/RankingSection';

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

export function useBananaDeltaCalculator(
  groupId: string,
  activeDateId: string | null,
  activeDate: string | null,
  currentGroup?: Group
) {
  const [bananaResults, setBananaResults] = useState<RankingItem[]>([]);
  const [streakResults, setStreakResults] = useState<RankingItem[]>([]);

  // دریافت لایو اطلاعات از دیتابیس
  const { data: allMembers } = useLiveQuery(
    db.select().from(members).where(eq(members.groupId, groupId))
  );
  const { data: allTargets } = useLiveQuery(
    db.select().from(memberTargets).where(eq(memberTargets.groupId, groupId))
  );
  const { data: allDates } = useLiveQuery(
    db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(asc(groupDates.persianDate))
  );
  const { data: allHistoricalLogs } = useLiveQuery(db.select().from(studyLogs));

  // رفرنس‌ها برای تشخیص تغییرات (Delta Detection)
  const prevLogsRef = useRef<any[]>([]);
  const prevMembersRef = useRef<any[]>([]);
  const lastDateIdRef = useRef<string | null>(null);
  const lastGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !activeDateId ||
      !currentGroup ||
      !activeDate ||
      !allMembers ||
      !allTargets ||
      !allDates ||
      !allHistoricalLogs
    )
      return;

    const targetDateIndex = allDates.findIndex((d) => d.id === activeDateId);
    const datesUpToActive =
      targetDateIndex >= 0 ? allDates.slice(0, targetDateIndex + 1) : [];
    const weekdayStr = getPersianWeekday(activeDate);

    // ۱. منطق پردازش یک کاربر خاص (Single-Member Calculation)
    const calculateSingleMember = (
      m: Member
    ): { bItem: RankingItem | null; sItem: RankingItem | null } => {
      const isChallenging =
        m.inBananaChallenge === true || m.inBananaChallenge === 1;
      if (!isChallenging) return { bItem: null, sItem: null };

      const memberJoinPersian = getPersianDateStr(new Date(m.joinedAt));
      const targetData = allTargets.find((t) => t.memberId === m.id);

      let todayTarget = 0;
      if (targetData) {
        if (targetData.targetType === 'FIXED') {
          todayTarget = targetData.defaultMinutes;
        } else {
          switch (weekdayStr) {
            case 'شنبه':
              todayTarget = targetData.saturdayMinutes;
              break;
            case 'یکشنبه':
              todayTarget = targetData.sundayMinutes;
              break;
            case 'دوشنبه':
              todayTarget = targetData.mondayMinutes;
              break;
            case 'سه‌شنبه':
              todayTarget = targetData.tuesdayMinutes;
              break;
            case 'چهارشنبه':
              todayTarget = targetData.wednesdayMinutes;
              break;
            case 'پنج‌شنبه':
              todayTarget = targetData.thursdayMinutes;
              break;
            case 'جمعه':
              todayTarget = targetData.fridayMinutes;
              break;
          }
        }
      }

      if (todayTarget === 0) return { bItem: null, sItem: null };

      const validDates = datesUpToActive.filter((d) => {
        if (d.id === activeDateId) return true;
        if (d.persianDate >= memberJoinPersian) return true;
        return allHistoricalLogs.some(
          (l) => l.memberId === m.id && l.groupDateId === d.id
        );
      });

      let consecutiveEggplants = 0;
      let eliminatedDateId: string | null = null;
      let maxHistoricalStreak = 0;
      let currentStreak = 0;

      for (const d of validDates) {
        const log = allHistoricalLogs.find(
          (l) => l.memberId === m.id && l.groupDateId === d.id
        );
        const mins = log ? log.studyMinutes : 0;

        let dTarget = 0;
        if (targetData) {
          if (targetData.targetType === 'FIXED') {
            dTarget = targetData.defaultMinutes;
          } else {
            const wd = getPersianWeekday(d.persianDate);
            switch (wd) {
              case 'شنبه':
                dTarget = targetData.saturdayMinutes;
                break;
              case 'یکشنبه':
                dTarget = targetData.sundayMinutes;
                break;
              case 'دوشنبه':
                dTarget = targetData.mondayMinutes;
                break;
              case 'سه‌شنبه':
                dTarget = targetData.tuesdayMinutes;
                break;
              case 'چهارشنبه':
                dTarget = targetData.wednesdayMinutes;
                break;
              case 'پنج‌شنبه':
                dTarget = targetData.thursdayMinutes;
                break;
              case 'جمعه':
                dTarget = targetData.fridayMinutes;
                break;
            }
          }
        }

        if (dTarget > 0) {
          if (mins >= dTarget) currentStreak++;
          else currentStreak = 0;
        }

        if (d.persianDate < activeDate) {
          maxHistoricalStreak = Math.max(maxHistoricalStreak, currentStreak);
        }

        if (mins < currentGroup.bananaThreshold) {
          consecutiveEggplants++;
        } else {
          consecutiveEggplants = 0;
        }

        if (
          consecutiveEggplants >= currentGroup.maxEggplantsAllowed &&
          eliminatedDateId === null
        ) {
          eliminatedDateId = d.id;
        }
      }

      const wasEliminatedBefore =
        eliminatedDateId !== null && eliminatedDateId !== activeDateId;
      const getsEliminatedToday = eliminatedDateId === activeDateId;

      if (wasEliminatedBefore) return { bItem: null, sItem: null };

      const todayLog = allHistoricalLogs.find(
        (l) => l.memberId === m.id && l.groupDateId === activeDateId
      );
      const todayMinutes = todayLog ? todayLog.studyMinutes : 0;

      if (todayMinutes === 0 && !getsEliminatedToday)
        return { bItem: null, sItem: null };

      let sItem: RankingItem | null = null;
      if (todayMinutes >= todayTarget) {
        const isRecordBroken =
          currentStreak > maxHistoricalStreak && currentStreak > 1;
        sItem = {
          id: m.id,
          name: m.name,
          timeMinutes: 0,
          value: currentStreak,
          streakStatusEmoji: isRecordBroken ? '🔥' : '✅'
        };
      }

      let statusEmoji = '🍆';
      let score = 1;

      if (getsEliminatedToday) {
        statusEmoji = '❌';
        score = 0;
      } else if (todayMinutes >= todayTarget) {
        statusEmoji = '✅';
        score = 3;
      } else if (todayMinutes >= currentGroup.bananaThreshold) {
        statusEmoji = '🍌';
        score = 2;
      }

      const bItem: RankingItem = {
        id: m.id,
        name: m.name,
        timeMinutes: todayMinutes,
        statusEmoji,
        sortScore: score,
        targetMinutes: todayTarget
      };

      return { bItem, sItem };
    };

    // --- ۲. استراتژی تزریق و مرتب‌سازی ---
    const isDateChanged = lastDateIdRef.current !== activeDateId;
    const isGroupChanged = lastGroupIdRef.current !== groupId;

    if (
      isDateChanged ||
      isGroupChanged ||
      prevMembersRef.current.length === 0
    ) {
      // اجرای کامل (Full Recalculation) - فقط در زمان تغییر تاریخ یا گروه
      const newB: RankingItem[] = [];
      const newS: RankingItem[] = [];

      allMembers.forEach((m) => {
        const { bItem, sItem } = calculateSingleMember(m as Member);
        if (bItem) newB.push(bItem);
        if (sItem) newS.push(sItem);
      });

      newB.sort((a, b) => {
        if (b.sortScore !== a.sortScore)
          return (b.sortScore || 0) - (a.sortScore || 0);
        return (b.targetMinutes || 0) - (a.targetMinutes || 0);
      });
      newS.sort((a, b) => (b.value || 0) - (a.value || 0));

      setBananaResults(newB);
      setStreakResults(newS);
    } else {
      // به‌روزرسانی افزایشی (Delta Update) - وقتی کاربر یا لاگ جدیدی اضافه شد
      const changedMemberIds = new Set<string>();

      allHistoricalLogs.forEach((newLog) => {
        const oldLog = prevLogsRef.current.find((l) => l.id === newLog.id);
        if (!oldLog || oldLog.studyMinutes !== newLog.studyMinutes) {
          changedMemberIds.add(newLog.memberId);
        }
      });

      allMembers.forEach((newMem) => {
        const oldMem = prevMembersRef.current.find((m) => m.id === newMem.id);
        if (!oldMem || JSON.stringify(oldMem) !== JSON.stringify(newMem)) {
          changedMemberIds.add(newMem.id);
        }
      });

      if (changedMemberIds.size > 0) {
        setBananaResults((prev) => {
          let updated = [...prev];
          changedMemberIds.forEach((mid) => {
            const m = allMembers.find((x) => x.id === mid);
            updated = updated.filter((x) => x.id !== mid);
            if (m) {
              const { bItem } = calculateSingleMember(m as Member);
              if (bItem) updated.push(bItem);
            }
          });
          // ۳. مرتب‌سازی مجدد در حافظه (Local Re-sorting)
          updated.sort((a, b) => {
            if (b.sortScore !== a.sortScore)
              return (b.sortScore || 0) - (a.sortScore || 0);
            return (b.targetMinutes || 0) - (a.targetMinutes || 0);
          });
          return updated;
        });

        setStreakResults((prev) => {
          let updated = [...prev];
          changedMemberIds.forEach((mid) => {
            const m = allMembers.find((x) => x.id === mid);
            updated = updated.filter((x) => x.id !== mid);
            if (m) {
              const { sItem } = calculateSingleMember(m as Member);
              if (sItem) updated.push(sItem);
            }
          });
          updated.sort((a, b) => (b.value || 0) - (a.value || 0));
          return updated;
        });
      }
    }

    lastDateIdRef.current = activeDateId;
    lastGroupIdRef.current = groupId;
    prevLogsRef.current = allHistoricalLogs;
    prevMembersRef.current = allMembers;
  }, [
    activeDateId,
    activeDate,
    currentGroup,
    allHistoricalLogs,
    allMembers,
    allTargets,
    allDates,
    groupId
  ]);

  return { bananaResults, streakResults };
}
