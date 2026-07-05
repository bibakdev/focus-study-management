import { db } from '@/core/database/db';
import { groupDates, groups, members, studyLogs } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { RankingItem } from '../../components/RankingSection';
import { RankingTabPresentational } from './RankingTab.presentational';

interface RankingTabContainerProps {
  groupId: string;
}

export function RankingTabContainer({ groupId }: RankingTabContainerProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [allChampions, setAllChampions] = useState<RankingItem[]>([]);
  const [recordBreakers, setRecordBreakers] = useState<RankingItem[]>([]);

  // تنظیمات فیلتر قهرمانان
  const [minFilterMinutes, setMinFilterMinutes] = useState<number>(120);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // دریافت اطلاعات گروه برای استخراج لینک ذخیره شده تاپیک
  const { data: groupData } = useLiveQuery(
    db.select().from(groups).where(eq(groups.id, groupId))
  );
  const currentGroup = groupData?.[0];

  const { data: savedDates } = useLiveQuery(
    db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(desc(groupDates.createdAt))
  );

  useEffect(() => {
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditing) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditing]);

  // دریافت اطلاعات و محاسبه پویا برای رتبه‌بندی و رکوردشکنی
  useEffect(() => {
    if (!activeDateId) {
      setAllChampions([]);
      setRecordBreakers([]);
      return;
    }

    const fetchRankings = async () => {
      try {
        const allGroupLogs = await db
          .select({
            id: studyLogs.id,
            memberId: studyLogs.memberId,
            name: members.name,
            studyMinutes: studyLogs.studyMinutes,
            groupDateId: studyLogs.groupDateId
          })
          .from(studyLogs)
          .innerJoin(members, eq(studyLogs.memberId, members.id))
          .innerJoin(groupDates, eq(studyLogs.groupDateId, groupDates.id))
          .where(eq(groupDates.groupId, groupId));

        const todayLogs = allGroupLogs.filter(
          (log) => log.groupDateId === activeDateId
        );
        const historicalLogs = allGroupLogs.filter(
          (log) => log.groupDateId !== activeDateId
        );

        const sortedChampions: RankingItem[] = todayLogs
          .sort((a, b) => b.studyMinutes - a.studyMinutes)
          .map((log) => ({
            id: log.id,
            name: log.name,
            timeMinutes: log.studyMinutes
          }));

        const breakers: RankingItem[] = [];

        for (const log of todayLogs) {
          const pastLogs = historicalLogs.filter(
            (l) => l.memberId === log.memberId
          );

          const bestPastRecord =
            pastLogs.length > 0
              ? Math.max(...pastLogs.map((l) => l.studyMinutes))
              : 0;

          if (bestPastRecord > 0 && log.studyMinutes > bestPastRecord) {
            breakers.push({
              id: `breaker_${log.id}`,
              name: log.name,
              timeMinutes: log.studyMinutes,
              oldRecordMinutes: bestPastRecord
            });
          }
        }

        breakers.sort((a, b) => {
          const improvementA = a.timeMinutes - (a.oldRecordMinutes || 0);
          const improvementB = b.timeMinutes - (b.oldRecordMinutes || 0);
          return improvementB - improvementA;
        });

        setAllChampions(sortedChampions);
        setRecordBreakers(breakers);
      } catch (error) {
        console.error('Error fetching rankings:', error);
      }
    };

    fetchRankings();
  }, [activeDateId, groupId]);

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

      setIsEditing(false);
      setActiveDate(date);
      setActiveDateId(currentId);
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ذخیره یا انتخاب تاریخ رخ داد.');
    }
  };

  const handleEditDate = () => {
    setIsEditing(true);
    setActiveDate(null);
    setActiveDateId(null);
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

  const championsToDisplay = allChampions.filter(
    (c) => c.timeMinutes >= minFilterMinutes
  );

  return (
    <RankingTabPresentational
      selectedDate={activeDate}
      champions={championsToDisplay}
      recordBreakers={recordBreakers}
      onConfirmDate={handleConfirmDate}
      onEditDate={handleEditDate}
      minFilterMinutes={minFilterMinutes}
      onSetFilter={(mins) => {
        setMinFilterMinutes(mins);
        setIsFilterModalOpen(false);
      }}
      isFilterModalOpen={isFilterModalOpen}
      onOpenFilterModal={() => setIsFilterModalOpen(true)}
      onCloseFilterModal={() => setIsFilterModalOpen(false)}
      topicLink={currentGroup?.telegramTopicLink || undefined}
      onTopicLinkSave={handleTopicLinkSave}
    />
  );
}
