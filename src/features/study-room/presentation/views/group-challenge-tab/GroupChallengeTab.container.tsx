import { db } from '@/core/database/db';
import { groupDates, groups } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { GroupChallengeTabPresentational } from './GroupChallengeTab.presentational';

interface GroupChallengeTabContainerProps {
  groupId: string;
}

export function GroupChallengeTabContainer({
  groupId
}: GroupChallengeTabContainerProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);

  const [hasStartedChallenge, setHasStartedChallenge] = useState(false);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [isChallengeFinished, setIsChallengeFinished] = useState(false);
  const [challengeSettings, setChallengeSettings] = useState<any>(null);

  // دریافت اطلاعات گروه برای لینک تلگرام
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
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditingDate) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditingDate]);

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

  const handleViewStatus = (settings: any) => {
    setChallengeSettings(settings);
    setHasStartedChallenge(true);
  };

  const handleStartFinalChallenge = () => {
    setIsChallengeActive(true);
  };

  const handleEndChallenge = () => {
    Alert.alert(
      'خاتمه چالش',
      'آیا از پایان دادن به این چالش اطمینان دارید؟ نتایج نهایی محاسبه خواهد شد.',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'پایان چالش',
          style: 'destructive',
          onPress: () => {
            setIsChallengeActive(false);
            setIsChallengeFinished(true);
          }
        }
      ]
    );
  };

  const handleResetChallenge = () => {
    setIsChallengeFinished(false);
    setHasStartedChallenge(false);
    setChallengeSettings(null);
  };

  // ذخیره کردن لینک تاپیک تلگرام
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

  const dummyWinnerData = isChallengeFinished
    ? {
        teamName: challengeSettings?.teams[0] || 'عقاب‌ها 🦅',
        topMembers: [
          { id: '2', name: 'سارا', totalMinutes: 450 },
          { id: '1', name: 'علی', totalMinutes: 320 }
        ]
      }
    : null;

  return (
    <GroupChallengeTabPresentational
      selectedDate={activeDate}
      onConfirmDate={handleConfirmDate}
      onEditDate={handleEditDate}
      onViewStatus={handleViewStatus}
      hasStartedChallenge={hasStartedChallenge}
      isChallengeActive={isChallengeActive}
      isChallengeFinished={isChallengeFinished}
      onStartFinalChallenge={handleStartFinalChallenge}
      onEndChallenge={handleEndChallenge}
      onResetChallenge={handleResetChallenge}
      challengeSettings={challengeSettings}
      dummyWinnerData={dummyWinnerData}
      topicLink={currentGroup?.telegramTopicLink || undefined}
      onTopicLinkSave={handleTopicLinkSave}
    />
  );
}
