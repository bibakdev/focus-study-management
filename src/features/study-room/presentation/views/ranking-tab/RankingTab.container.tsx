import { db } from '@/core/database/db';
import { groupDates, members, studyLogs } from '@/core/database/schema';
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
  const [minFilterMinutes, setMinFilterMinutes] = useState<number>(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

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
        // دریافت تمام لاگ‌های ثبت شده در این گروه (تاریخ امروز + تمام تاریخ‌های گذشته)
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

        // تفکیک لاگ‌های امروز از لاگ‌های گذشته
        const todayLogs = allGroupLogs.filter(
          (log) => log.groupDateId === activeDateId
        );
        const historicalLogs = allGroupLogs.filter(
          (log) => log.groupDateId !== activeDateId
        );

        // ۱. لیست قهرمانان (مرتب شده بر اساس تایم امروز)
        const sortedChampions: RankingItem[] = todayLogs
          .sort((a, b) => b.studyMinutes - a.studyMinutes)
          .map((log) => ({
            id: log.id,
            name: log.name,
            timeMinutes: log.studyMinutes
          }));

        // ۲. محاسبه رکوردشکنان به صورت پویا (بدون وابستگی به کش دیتابیس)
        const breakers: RankingItem[] = [];

        for (const log of todayLogs) {
          // استخراج تمام تایم‌های قبلی این شخص
          const pastLogs = historicalLogs.filter(
            (l) => l.memberId === log.memberId
          );

          // یافتن بهترین رکورد شخصی در گذشته
          const bestPastRecord =
            pastLogs.length > 0
              ? Math.max(...pastLogs.map((l) => l.studyMinutes))
              : 0;

          // اگر رکوردی در گذشته داشته و تایم امروزش از آن بیشتر شده است
          if (bestPastRecord > 0 && log.studyMinutes > bestPastRecord) {
            breakers.push({
              id: `breaker_${log.id}`,
              name: log.name,
              timeMinutes: log.studyMinutes,
              oldRecordMinutes: bestPastRecord
            });
          }
        }

        // مرتب‌سازی لیست رکوردشکنان بر اساس "میزان پیشرفت" (اختلاف زمان امروز با رکورد قبلی)
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

  // فیلتر کردن لیست قهرمانان پیش از ارسال به کامپوننت نمایشی
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
    />
  );
}
