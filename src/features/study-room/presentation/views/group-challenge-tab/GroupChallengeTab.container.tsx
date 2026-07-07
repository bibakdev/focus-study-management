// src/features/study-room/presentation/views/group-challenge-tab/GroupChallengeTab.container.tsx
import { db } from '@/core/database/db';
import {
  groupDates,
  groups,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { CalculatedTeam } from '../../components/ActiveChallengeBoard';
import { GroupChallengeTabPresentational } from './GroupChallengeTab.presentational';

interface GroupChallengeTabContainerProps {
  groupId: string;
}

const formatTimeHelper = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// محاسبه روزهای اختلاف تقریبی
const getDaysDiff = (startStr: string, endStr: string) => {
  const [sy, sm, sd] = startStr.split('/').map(Number);
  const [ey, em, ed] = endStr.split('/').map(Number);
  const getAbsoluteDays = (y: number, m: number, d: number) => {
    let days = y * 365.25;
    for (let i = 1; i < m; i++) days += i <= 6 ? 31 : 30;
    return days + d;
  };
  return Math.floor(getAbsoluteDays(ey, em, ed) - getAbsoluteDays(sy, sm, sd));
};

export function GroupChallengeTabContainer({
  groupId
}: GroupChallengeTabContainerProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);

  const [hasStartedChallenge, setHasStartedChallenge] = useState(false);
  const [challengeSettings, setChallengeSettings] = useState<any>(null);

  // دیتابیس
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

  const { data: allMembers } = useLiveQuery(
    db.select().from(members).where(eq(members.groupId, groupId))
  );
  const { data: allTargets } = useLiveQuery(
    db.select().from(memberTargets).where(eq(memberTargets.groupId, groupId))
  );
  const { data: allLogs } = useLiveQuery(db.select().from(studyLogs));

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
      Alert.alert('خطا', 'مشکلی رخ داد.');
    }
  };

  const handleEditDate = () => {
    setIsEditingDate(true);
    setActiveDate(null);
    setActiveDateId(null);
  };

  // الگوریتم حریصانه
  const handleViewStatus = (settings: any) => {
    if (!allMembers || !allTargets) return;
    const eligibleMembers = allMembers.filter(
      (m) => m.isActive && m.inGroupChallenge
    );

    if (eligibleMembers.length === 0) {
      Alert.alert(
        'لیست خالی',
        'هیچ کاربری در این گروه برای چالش تیمی فعال نشده است.'
      );
      return;
    }

    const membersWithPower = eligibleMembers.map((m) => {
      const target = allTargets.find((t) => t.memberId === m.id);
      let avgMinutes = 0;
      if (target) {
        if (target.targetType === 'FIXED') avgMinutes = target.defaultMinutes;
        else
          avgMinutes =
            (target.saturdayMinutes +
              target.sundayMinutes +
              target.mondayMinutes +
              target.tuesdayMinutes +
              target.wednesdayMinutes +
              target.thursdayMinutes +
              target.fridayMinutes) /
            7;
      }
      return {
        id: m.id,
        name: m.name,
        targetStr: formatTimeHelper(avgMinutes),
        power: avgMinutes
      };
    });

    membersWithPower.sort((a, b) => b.power - a.power);

    const teamCount = settings.teamCount;
    const teamTotals = new Array(teamCount).fill(0);
    const allocatedMembers: any[] = [];

    membersWithPower.forEach((m) => {
      let minTeamIndex = 0;
      let minTotal = teamTotals[0];
      for (let i = 1; i < teamCount; i++) {
        if (teamTotals[i] < minTotal) {
          minTotal = teamTotals[i];
          minTeamIndex = i;
        }
      }
      allocatedMembers.push({
        id: m.id,
        name: m.name,
        target: m.targetStr, // 🔴 مشکل اینجا بود (تغییر از targetStr به target)
        dailyTargetMinutes: m.power,
        teamIndex: minTeamIndex
      });
      teamTotals[minTeamIndex] += m.power;
    });

    setChallengeSettings({ ...settings, allocatedMembers });
    setHasStartedChallenge(true);
  };

  // ثبت در دیتابیس (شروع قطعی)
  const handleStartFinalChallenge = async (finalMembersList: any[]) => {
    try {
      const finalChallengeData = {
        startDate: challengeSettings.startDate,
        duration: challengeSettings.duration,
        teams: challengeSettings.teams,
        members: finalMembersList
      };
      await db
        .update(groups)
        .set({ activeChallengeData: JSON.stringify(finalChallengeData) })
        .where(eq(groups.id, groupId));
      setChallengeSettings(null);
      setHasStartedChallenge(false);
    } catch (e) {
      Alert.alert('خطا', 'مشکلی در شروع چالش رخ داد.');
    }
  };

  // ویرایش نام تیم در زمان اجرای چالش
  const handleUpdateTeamName = async (oldName: string, newName: string) => {
    if (!currentGroup?.activeChallengeData || !newName.trim()) return;

    try {
      const activeData = JSON.parse(currentGroup.activeChallengeData);

      // پیدا کردن ایندکس تیم در آرایه اصلی (چون لیست در UI مرتب شده است)
      const teamIdx = activeData.teams.findIndex((t: string) => t === oldName);

      if (teamIdx !== -1) {
        activeData.teams[teamIdx] = newName.trim();

        await db
          .update(groups)
          .set({ activeChallengeData: JSON.stringify(activeData) })
          .where(eq(groups.id, groupId));
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ویرایش نام تیم رخ داد.');
    }
  };

  // پایان چالش (اعطای مدال‌ها و ذخیره نتایج)
  const handleEndChallenge = () => {
    Alert.alert(
      'پایان چالش',
      'آیا از اتمام قطعی چالش و اهدای مدال‌ها اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'پایان و ثبت',
          style: 'destructive',
          onPress: async () => {
            // پیدا کردن تیم‌ها از استیت محاسبه شده
            if (teamsData.length === 0) return;

            // تیم‌ها قبلاً در render مرتب شده‌اند (teamsData[0] قهرمان است)
            const winningTeam = teamsData[0];
            const allRankedMembers = winningTeam.members.sort(
              (a, b) => b.currentMinutes - a.currentMinutes
            );

            try {
              // افزایش مدال برای اعضای تیم برنده
              for (let i = 0; i < allRankedMembers.length; i++) {
                const mId = allRankedMembers[i].id;
                const dbMember = allMembers?.find((m) => m.id === mId);
                if (!dbMember) continue;

                let updates: any = {
                  teamChampionships: dbMember.teamChampionships + 1
                };
                if (i === 0)
                  updates.teamFirstPlaces = dbMember.teamFirstPlaces + 1;
                else if (i === 1)
                  updates.teamSecondPlaces = dbMember.teamSecondPlaces + 1;
                else if (i === 2)
                  updates.teamThirdPlaces = dbMember.teamThirdPlaces + 1;

                await db
                  .update(members)
                  .set(updates)
                  .where(eq(members.id, mId));
              }

              // ذخیره تاریخچه
              const resultData = {
                teamName: winningTeam.name,
                topMembers: allRankedMembers.slice(0, 3).map((m) => ({
                  id: m.id,
                  name: m.name,
                  totalMinutes: m.currentMinutes
                }))
              };

              await db
                .update(groups)
                .set({
                  activeChallengeData: null,
                  lastChallengeResultData: JSON.stringify(resultData)
                })
                .where(eq(groups.id, groupId));
            } catch (e) {
              Alert.alert('خطا در ثبت نتایج');
            }
          }
        }
      ]
    );
  };

  const handleResetChallenge = async () => {
    await db
      .update(groups)
      .set({ lastChallengeResultData: null })
      .where(eq(groups.id, groupId));
  };

  const handleTopicLinkSave = async (link: string) => {
    try {
      await db
        .update(groups)
        .set({ telegramTopicLink: link })
        .where(eq(groups.id, groupId));
    } catch (error) {}
  };

  // 🔴 محاسبه زنده اطلاعات از دیتابیس
  let isChallengeActive = false;
  let isChallengeFinished = !!currentGroup?.lastChallengeResultData;
  let currentDay = 1;
  let teamsData: CalculatedTeam[] = [];
  let duration = 5;
  let dummyWinnerData = null;

  if (currentGroup?.lastChallengeResultData) {
    dummyWinnerData = JSON.parse(currentGroup.lastChallengeResultData);
  }

  if (
    currentGroup?.activeChallengeData &&
    activeDate &&
    savedDates &&
    allLogs
  ) {
    const activeData = JSON.parse(currentGroup.activeChallengeData);
    isChallengeActive = true;
    duration = activeData.duration;

    // محاسبه روز با مقایسه تاریخ تقویم (activeDate) و تاریخ شروع (startDate)
    currentDay = getDaysDiff(activeData.startDate, activeDate) + 1;
    if (currentDay < 1) currentDay = 1; // در صورتی که تاریخ انتخاب شده قبل از شروع چالش باشد
    if (currentDay > duration) currentDay = duration;

    // استخراج ID تمام تاریخ‌هایی که بین شروع چالش تا روز انتخابی (currentDay) بوده‌اند
    const validGroupDates = savedDates.filter(
      (d) =>
        d.persianDate >= activeData.startDate && d.persianDate <= activeDate
    );
    const validDateIds = validGroupDates.map((d) => d.id);

    // فیلتر کردن لاگ‌های مطالعه برای این روزها
    const validLogs = allLogs.filter((log) =>
      validDateIds.includes(log.groupDateId)
    );

    // محاسبه مجموع تایم هر کاربر در روزهای مورد نظر
    const calculatedMembers = activeData.members.map((m: any) => {
      const userLogs = validLogs.filter((l) => l.memberId === m.id);
      const totalStudy = userLogs.reduce(
        (sum, curr) => sum + curr.studyMinutes,
        0
      );
      return {
        id: m.id,
        name: m.name,
        dailyTargetMinutes: m.dailyTargetMinutes,
        currentMinutes: totalStudy,
        teamIndex: m.teamIndex
      };
    });

    // تفکیک بر اساس تیم‌ها و مرتب‌سازی
    teamsData = activeData.teams.map((teamName: string, idx: number) => {
      const tMembers = calculatedMembers.filter(
        (m: any) => m.teamIndex === idx
      );
      const teamTotal = tMembers.reduce(
        (sum: number, curr: any) => sum + curr.currentMinutes,
        0
      );
      return {
        name: teamName,
        totalMinutes: teamTotal,
        members: tMembers.sort(
          (a: any, b: any) => b.currentMinutes - a.currentMinutes
        )
      };
    });

    teamsData.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

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
      onUpdateTeamName={handleUpdateTeamName} // ارسال تابع ویرایش نام
      onEndChallenge={handleEndChallenge}
      onResetChallenge={handleResetChallenge}
      challengeSettings={challengeSettings}
      dummyWinnerData={dummyWinnerData}
      topicLink={currentGroup?.telegramTopicLink || undefined}
      onTopicLinkSave={handleTopicLinkSave}
      teamsData={teamsData} // 🔴 ارسال اطلاعات زنده
      currentDay={currentDay}
      duration={duration}
    />
  );
}
