// src/features/study-room/presentation/views/banana-tab/BananaTab.container.tsx
import { db } from '@/core/database/db';
import { groupDates, groups, members } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { calculateSingleMemberStats } from '../../../domain/use-cases/calculate-single-member-stats';
import { BananaTabPresentational } from './BananaTab.presentational';
import { useBananaDeltaCalculator } from './use-banana-calculator';

interface BananaTabContainerProps {
  groupId: string;
}

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

  useEffect(() => {
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditingDate) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditingDate]);

  const { bananaResults, streakResults } = useBananaDeltaCalculator(
    groupId,
    activeDateId,
    activeDate,
    currentGroup
  );

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

      // باز-محاسبه کردن تمام کاربران برای اعمال تغییرات جدید قوانین چالش در دیتابیس
      const groupMembers = await db
        .select()
        .from(members)
        .where(eq(members.groupId, groupId));
      for (const m of groupMembers) {
        await calculateSingleMemberStats(groupId, m.id);
      }
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
