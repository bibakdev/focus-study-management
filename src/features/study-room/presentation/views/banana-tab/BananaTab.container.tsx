import { db } from '@/core/database/db';
import { groupDates, groups, members, studyLogs } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { RankingItem } from '../../components/RankingSection';
import { BananaTabPresentational } from './BananaTab.presentational';

interface BananaTabContainerProps {
  groupId: string;
}

export function BananaTabContainer({ groupId }: BananaTabContainerProps) {
  // ۱. دریافت اطلاعات گروه برای تنظیمات چالش و ذخیره لینک تلگرام
  const { data: groupData } = useLiveQuery(
    db.select().from(groups).where(eq(groups.id, groupId))
  );

  const currentGroup = groupData?.[0];
  const bananaHours = currentGroup
    ? Math.floor(currentGroup.bananaThreshold / 60)
    : 2;
  const maxEggplants = currentGroup ? currentGroup.maxEggplantsAllowed : 3;

  // ۲. منطق مربوط به انتخاب تاریخ
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

  useEffect(() => {
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditingDate) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditingDate]);

  // ۳. واکشی لاگ‌های تاریخ فعلی و کاربران برای محاسبه موز و استمرار
  const { data: currentDayLogs } = useLiveQuery(
    db
      .select()
      .from(studyLogs)
      .where(eq(studyLogs.groupDateId, activeDateId || ''))
  );

  const { data: groupMembers } = useLiveQuery(
    db.select().from(members).where(eq(members.groupId, groupId))
  );

  const [bananaResults, setBananaResults] = useState<RankingItem[]>([]);
  const [streakResults, setStreakResults] = useState<RankingItem[]>([]);

  useEffect(() => {
    if (groupMembers && currentGroup) {
      const activeBananaMembers = groupMembers.filter(
        (m) => m.inBananaChallenge
      );

      // محاسبه تعداد موزهای دریافت شده
      const bResults: RankingItem[] = [];
      activeBananaMembers.forEach((m) => {
        const log = currentDayLogs?.find((l) => l.memberId === m.id);
        const minutes = log ? log.studyMinutes : 0;
        const bananasEarned = Math.floor(
          minutes / currentGroup.bananaThreshold
        );

        if (bananasEarned > 0) {
          bResults.push({
            id: m.id,
            name: m.name,
            timeMinutes: 0, // استفاده نمی‌شود اما برای تایپ الزامی است
            value: bananasEarned
          });
        }
      });
      bResults.sort((a, b) => (b.value || 0) - (a.value || 0));
      setBananaResults(bResults);

      // محاسبه استمرارها
      const sResults: RankingItem[] = [];
      activeBananaMembers.forEach((m) => {
        if (m.activeStreak > 0) {
          sResults.push({
            id: m.id,
            name: m.name,
            timeMinutes: 0,
            value: m.activeStreak
          });
        }
      });
      sResults.sort((a, b) => (b.value || 0) - (a.value || 0));
      setStreakResults(sResults);
    }
  }, [groupMembers, currentDayLogs, currentGroup]);

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

  const handleUpdateSettings = async (hours: number, eggplants: number) => {
    try {
      await db
        .update(groups)
        .set({
          bananaThreshold: hours * 60,
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
      bananaHours={bananaHours}
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
