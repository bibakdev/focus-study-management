import { db } from '@/core/database/db';
import {
  groupDates,
  groups,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { getPersianWeekday } from '@/core/utils/date';
import { generateUUID } from '@/core/utils/uuid';
import { and, asc, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { RankingItem } from '../../components/RankingSection';
import { BananaTabPresentational } from './BananaTab.presentational';

interface BananaTabContainerProps {
  groupId: string;
}

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

export function BananaTabContainer({ groupId }: BananaTabContainerProps) {
  const { data: groupData } = useLiveQuery(
    db.select().from(groups).where(eq(groups.id, groupId))
  );

  const currentGroup = groupData?.[0];
  const bananaThreshold = currentGroup ? currentGroup.bananaThreshold : 120;
  const maxEggplants = currentGroup ? currentGroup.maxEggplantsAllowed : 3;

  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);

  const { data: savedDates } = useLiveQuery(
    db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(desc(groupDates.createdAt))
  );

  const [bananaResults, setBananaResults] = useState<RankingItem[]>([]);
  const [streakResults, setStreakResults] = useState<RankingItem[]>([]);

  useEffect(() => {
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditingDate) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditingDate]);

  useEffect(() => {
    if (!activeDateId || !currentGroup || !activeDate) {
      setBananaResults([]);
      setStreakResults([]);
      return;
    }

    const fetchBananaData = async () => {
      try {
        const allMembers = await db
          .select()
          .from(members)
          .where(eq(members.groupId, groupId));
        const allTargets = await db
          .select()
          .from(memberTargets)
          .where(eq(memberTargets.groupId, groupId));

        const allDates = await db
          .select()
          .from(groupDates)
          .where(eq(groupDates.groupId, groupId))
          .orderBy(asc(groupDates.persianDate));

        const allHistoricalLogs = await db.select().from(studyLogs);

        const weekdayStr = getPersianWeekday(activeDate);
        const bResults: RankingItem[] = [];
        const sResults: RankingItem[] = [];

        const targetDateIndex = allDates.findIndex(
          (d) => d.id === activeDateId
        );
        const datesUpToActive =
          targetDateIndex >= 0 ? allDates.slice(0, targetDateIndex + 1) : [];

        for (const m of allMembers) {
          const isChallenging =
            m.inBananaChallenge === true || m.inBananaChallenge === 1;

          if (!isChallenging) continue;

          const memberJoinPersian = getPersianDateStr(new Date(m.joinedAt));
          const targetData = allTargets.find((t) => t.memberId === m.id);

          let todayTarget = 0; // <--- پیش فرض به 0 تغییر کرد
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

          // 🟢 شرط جدید: اگر تارگت شخص امروز صفر است، نباید در لیست‌ها بیاید
          if (todayTarget === 0) continue;

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

            let dTarget = 0; // <--- پیش فرض صفر
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

            // اگر تارگت گذشته هم صفر بوده استمرار نباید محاسبه شود
            if (dTarget > 0) {
              if (mins >= dTarget) {
                currentStreak++;
              } else {
                currentStreak = 0;
              }
            }

            if (d.persianDate < activeDate) {
              maxHistoricalStreak = Math.max(
                maxHistoricalStreak,
                currentStreak
              );
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

          if (wasEliminatedBefore) continue;

          const todayLog = allHistoricalLogs.find(
            (l) => l.memberId === m.id && l.groupDateId === activeDateId
          );
          const todayMinutes = todayLog ? todayLog.studyMinutes : 0;

          if (todayMinutes === 0 && !getsEliminatedToday) continue;

          const gotCheckmarkToday = todayMinutes >= todayTarget;

          if (gotCheckmarkToday) {
            const isRecordBroken =
              currentStreak > maxHistoricalStreak && currentStreak > 1;

            sResults.push({
              id: m.id,
              name: m.name,
              timeMinutes: 0,
              value: currentStreak,
              streakStatusEmoji: isRecordBroken ? '🔥' : '✅'
            });
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
          } else {
            statusEmoji = '🍆';
            score = 1;
          }

          bResults.push({
            id: m.id,
            name: m.name,
            timeMinutes: todayMinutes,
            statusEmoji: statusEmoji,
            sortScore: score,
            targetMinutes: todayTarget
          });
        }

        bResults.sort((a, b) => {
          if (b.sortScore !== a.sortScore) {
            return (b.sortScore || 0) - (a.sortScore || 0);
          }
          return (b.targetMinutes || 0) - (a.targetMinutes || 0);
        });

        sResults.sort((a, b) => (b.value || 0) - (a.value || 0));

        setBananaResults(bResults);
        setStreakResults(sResults);
      } catch (error) {
        console.error('Error fetching banana tab data:', error);
      }
    };

    fetchBananaData();
  }, [activeDateId, currentGroup, activeDate, groupId]);

  const handleConfirmDate = async (date: string) => {
    try {
      const existingRecords = await db
        .select()
        .from(groupDates)
        .where(
          and(eq(groupDates.groupId, groupId), eq(groupDates.persianDate, date))
        );

      let currentId =
        existingRecords.length === 0 ? generateUUID() : existingRecords[0].id;

      if (existingRecords.length === 0) {
        await db.insert(groupDates).values({
          id: currentId,
          groupId,
          persianDate: date,
          createdAt: new Date()
        });
      }

      setIsEditingDate(false);
      setActiveDate(date);
      setActiveDateId(currentId);
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ذخیره یا انتخاب تاریخ رخ داد.');
    }
  };

  const handleEditDate = () => {
    setIsEditingDate(true);
    setActiveDate(null);
    setActiveDateId(null);
  };

  const handleUpdateSettings = async (
    thresholdMinutes: number,
    eggplants: number
  ) => {
    try {
      await db
        .update(groups)
        .set({
          bananaThreshold: thresholdMinutes,
          maxEggplantsAllowed: eggplants
        })
        .where(eq(groups.id, groupId));
    } catch (error) {
      console.error('Error updating banana challenge settings:', error);
      Alert.alert('خطا', 'مشکلی در بروزرسانی تنظیمات رخ داد.');
    }
  };

  const handleTopicLinkSave = async (link: string) => {
    try {
      await db
        .update(groups)
        .set({ telegramTopicLink: link })
        .where(eq(groups.id, groupId));
    } catch (error) {
      console.error('Error saving topic link', error);
    }
  };

  return (
    <BananaTabPresentational
      bananaThreshold={bananaThreshold}
      maxEggplants={maxEggplants}
      onUpdateSettings={handleUpdateSettings}
      selectedDate={activeDate}
      onConfirmDate={handleConfirmDate}
      onEditDate={handleEditDate}
      bananaResults={bananaResults}
      streakResults={streakResults}
      topicLink={currentGroup?.telegramTopicLink || undefined}
      onTopicLinkSave={handleTopicLinkSave}
    />
  );
}
