import { db } from '@/core/database/db';
import {
  groupDates,
  members,
  memberTargets,
  studyLogs
} from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MemberStatusRepositoryImpl } from '../../../data/repositories/member-status.repository.impl';
import { Member } from '../../../domain/entities/member';
import { CalculateAbsenceUseCase } from '../../../domain/use-cases/calculate-absence.use-case';
import {
  ConflictGroup,
  ExtractedRecord
} from '../../components/ExtractedUsersList';
import { FinalLog } from '../../components/FinalLogsList';
import { TimeTabPresentational } from './TimeTab.presentational';

// معرفی Use Case برای محاسبه غیبت‌ها
const memberStatusRepo = new MemberStatusRepositoryImpl();
const calculateAbsenceUseCase = new CalculateAbsenceUseCase(memberStatusRepo);

interface TimeTabContainerProps {
  groupId: string;
}

const parseTimeStringToMinutes = (timeStr: string): number => {
  let h = 0;
  let m = 0;
  const hMatch = timeStr.match(/(\d+)\s*h/i);
  const mMatch = timeStr.match(/(\d+)\s*m/i);
  if (hMatch) h = parseInt(hMatch[1], 10);
  if (mMatch) m = parseInt(mMatch[1], 10);
  return h * 60 + m;
};

const formatTimeStr = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h 0m`;
  return `${m}m`;
};

const MAX_STUDY_MINUTES = 18 * 60;

export function TimeTabContainer({ groupId }: TimeTabContainerProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeDateId, setActiveDateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoggingTime, setIsLoggingTime] = useState(false);

  const [oldUsers, setOldUsers] = useState<ExtractedRecord[]>([]);
  const [newUsers, setNewUsers] = useState<ExtractedRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);

  const [finalLogs, setFinalLogs] = useState<FinalLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: savedDates } = useLiveQuery(
    db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(desc(groupDates.createdAt))
  );

  const { data: groupMembers } = useLiveQuery(
    db.select().from(members).where(eq(members.groupId, groupId))
  );

  useEffect(() => {
    if (!activeDateId) {
      setFinalLogs([]);
      return;
    }
    const fetchLogs = async () => {
      try {
        const logs = await db
          .select({
            id: studyLogs.id,
            memberId: members.id,
            memberName: members.name,
            studyMinutes: studyLogs.studyMinutes
          })
          .from(studyLogs)
          .innerJoin(members, eq(studyLogs.memberId, members.id))
          .where(eq(studyLogs.groupDateId, activeDateId))
          .orderBy(desc(studyLogs.createdAt));

        setFinalLogs(logs);
      } catch (error) {
        console.error('Fetch Logs Error', error);
      }
    };
    fetchLogs();
  }, [activeDateId, refreshKey]);

  useEffect(() => {
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditing) {
      setActiveDate(savedDates[0].persianDate);
      setActiveDateId(savedDates[0].id);
    }
  }, [savedDates, activeDate, isEditing]);

  // متد کمکی برای اجرای محاسبه پس از هر تغییر
  const recalculateAbsence = async () => {
    try {
      await calculateAbsenceUseCase.execute(groupId);
    } catch (error) {
      console.error('Error recalculating absence:', error);
    }
  };

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

      await recalculateAbsence(); // محاسبه پس از اضافه کردن تاریخ جدید
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ذخیره تاریخ رخ داد.');
    }
  };

  const handleEditDate = () => {
    setIsEditing(true);
    setActiveDate(null);
    setActiveDateId(null);
  };

  const handleSubmitLog = async (data: {
    memberId?: string;
    name: string;
    minutes: number;
  }) => {
    if (!activeDateId) return;
    setIsLoggingTime(true);
    try {
      const trimmedName = data.name.trim();
      let finalMemberId = data.memberId;

      if (!finalMemberId) {
        const currentMembers = await db
          .select()
          .from(members)
          .where(eq(members.groupId, groupId));

        const existingMember = currentMembers.find(
          (m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingMember) {
          finalMemberId = existingMember.id;
        } else {
          finalMemberId = generateUUID();
          await db.insert(members).values({
            id: finalMemberId,
            groupId,
            name: trimmedName,
            isActive: true,
            inBananaChallenge: false,
            activeStreak: 0,
            absenceDays: 0,
            consecutiveEggplants: 0,
            joinedAt: new Date()
          });
          await db.insert(memberTargets).values({
            id: generateUUID(),
            memberId: finalMemberId,
            groupId,
            targetType: 'FIXED',
            defaultMinutes: 120
          });
        }
      }

      const existingLog = await db
        .select()
        .from(studyLogs)
        .where(
          and(
            eq(studyLogs.memberId, finalMemberId),
            eq(studyLogs.groupDateId, activeDateId)
          )
        );

      if (existingLog.length > 0) {
        Alert.alert(
          'تداخل نام',
          'کاربری با این نام قبلاً در لیست نهایی امروز ثبت شده است. لطفاً برای ثبت شخص جدید، نام او را تغییر دهید.'
        );
        return;
      }

      await db.insert(studyLogs).values({
        id: generateUUID(),
        memberId: finalMemberId,
        groupDateId: activeDateId,
        studyMinutes: data.minutes,
        createdAt: new Date()
      });

      setRefreshKey((prev) => prev + 1);
      await recalculateAbsence(); // محاسبه پس از ثبت تایم دستی
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ثبت زمان به وجود آمد.');
    } finally {
      setIsLoggingTime(false);
    }
  };

  const handleExtractJson = (jsonString: string) => {
    if (!activeDateId) return;
    try {
      const rawData = JSON.parse(jsonString) as Array<{
        name: string;
        today_time: string;
        isFocussing: boolean;
      }>;
      const localMembers = (groupMembers || []) as Member[];

      const tempOld: ExtractedRecord[] = [];
      const tempNew: ExtractedRecord[] = [];
      const tempConflicts: ConflictGroup[] = [];
      const nameCounts: Record<string, number> = {};

      const validData = rawData
        .map((item) => ({
          ...item,
          minutes: parseTimeStringToMinutes(item.today_time)
        }))
        .filter(
          (item) => item.minutes > 0 && item.minutes <= MAX_STUDY_MINUTES
        );

      validData.forEach((item) => {
        const trimmedName = item.name.trim();
        nameCounts[trimmedName] = (nameCounts[trimmedName] || 0) + 1;
      });

      validData.forEach((item) => {
        const trimmedName = item.name.trim();
        const record: ExtractedRecord = {
          id: generateUUID(),
          name: trimmedName,
          today_time: item.today_time,
          minutes: item.minutes,
          isFocussing: item.isFocussing
        };

        if (nameCounts[trimmedName] > 1) {
          const existingGroup = tempConflicts.find(
            (c) => c.conflict_name.toLowerCase() === trimmedName.toLowerCase()
          );
          if (existingGroup) existingGroup.records.push(record);
          else {
            const inDb = localMembers.some(
              (m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase()
            );
            tempConflicts.push({
              conflict_name: trimmedName,
              is_in_database: inDb,
              records: [record]
            });
          }
        } else {
          const matchedMember = localMembers.find(
            (m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase()
          );
          if (matchedMember) tempOld.push(record);
          else tempNew.push(record);
        }
      });

      setOldUsers(tempOld);
      setNewUsers(tempNew);
      setConflicts(tempConflicts);
    } catch (error) {
      Alert.alert('خطا', 'فرمت JSON نامعتبر است.');
    }
  };

  const processApproval = async (record: ExtractedRecord) => {
    if (!activeDateId) return;

    const currentMembers = await db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId));

    let targetMemberId = '';

    const matched = currentMembers.find(
      (m) => m.name.trim().toLowerCase() === record.name.trim().toLowerCase()
    );

    if (matched) {
      targetMemberId = matched.id;

      const existingLog = await db
        .select()
        .from(studyLogs)
        .where(
          and(
            eq(studyLogs.memberId, targetMemberId),
            eq(studyLogs.groupDateId, activeDateId)
          )
        );

      if (existingLog.length > 0) {
        throw new Error('DUPLICATE_LOG');
      }
    } else {
      targetMemberId = generateUUID();
      await db.insert(members).values({
        id: targetMemberId,
        groupId,
        name: record.name.trim(),
        isActive: true,
        inBananaChallenge: false,
        activeStreak: 0,
        absenceDays: 0,
        consecutiveEggplants: 0,
        joinedAt: new Date()
      });
      await db.insert(memberTargets).values({
        id: generateUUID(),
        memberId: targetMemberId,
        groupId,
        targetType: 'FIXED',
        defaultMinutes: 120
      });
    }

    if (targetMemberId) {
      await db.insert(studyLogs).values({
        id: generateUUID(),
        memberId: targetMemberId,
        groupDateId: activeDateId,
        studyMinutes: record.minutes,
        createdAt: new Date()
      });
    }
  };

  const handleApproveExtracted = async (
    record: ExtractedRecord,
    type: 'OLD' | 'NEW' | 'CONFLICT'
  ) => {
    try {
      await processApproval(record);

      if (type === 'OLD')
        setOldUsers((prev) => prev.filter((u) => u.id !== record.id));
      if (type === 'NEW')
        setNewUsers((prev) => prev.filter((u) => u.id !== record.id));
      if (type === 'CONFLICT') {
        setConflicts((prev) =>
          prev
            .map((group) => ({
              ...group,
              records: group.records.filter((r) => r.id !== record.id)
            }))
            .filter((group) => group.records.length > 0)
        );
      }
      setRefreshKey((prev) => prev + 1);
      await recalculateAbsence(); // محاسبه پس از تایید تکی
    } catch (error: any) {
      if (error.message === 'DUPLICATE_LOG') {
        Alert.alert(
          'تداخل نام',
          'این کاربر قبلاً در لیست نهایی امروز ثبت شده است. برای ثبت شخص جدید، ابتدا با زدن آیکون مداد نام او را تغییر دهید.'
        );
      } else {
        Alert.alert('خطا', 'مشکلی در ثبت کاربر پیش آمد.');
      }
    }
  };

  const handleApproveAllExtracted = async (type: 'OLD' | 'NEW') => {
    try {
      const recordsToProcess = type === 'OLD' ? oldUsers : newUsers;
      const successfulIds = new Set<string>();
      const failedNames: string[] = [];

      for (const record of recordsToProcess) {
        try {
          await processApproval(record);
          successfulIds.add(record.id);
        } catch (error: any) {
          if (error.message === 'DUPLICATE_LOG') {
            failedNames.push(record.name);
          } else {
            throw error;
          }
        }
      }

      if (type === 'OLD') {
        setOldUsers((prev) => prev.filter((u) => !successfulIds.has(u.id)));
      }
      if (type === 'NEW') {
        setNewUsers((prev) => prev.filter((u) => !successfulIds.has(u.id)));
      }

      if (failedNames.length > 0) {
        Alert.alert(
          'تداخل نام',
          `کاربران زیر قبلاً در لیست نهایی امروز ثبت شده‌اند و اضافه نشدند. در صورت نیاز با زدن آیکون مداد نام آن‌ها را تغییر دهید:\n\n${failedNames.join(', ')}`
        );
      }

      setRefreshKey((prev) => prev + 1);
      await recalculateAbsence(); // محاسبه پس از تایید همه
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ثبت گروهی پیش آمد.');
    }
  };

  const handleDeleteExtracted = (
    id: string,
    type: 'OLD' | 'NEW' | 'CONFLICT'
  ) => {
    if (type === 'OLD') setOldUsers((prev) => prev.filter((u) => u.id !== id));
    if (type === 'NEW') setNewUsers((prev) => prev.filter((u) => u.id !== id));
    if (type === 'CONFLICT') {
      setConflicts((prev) =>
        prev
          .map((group) => ({
            ...group,
            records: group.records.filter((r) => r.id !== id)
          }))
          .filter((group) => group.records.length > 0)
      );
    }
  };

  const handleUpdateExtracted = (
    id: string,
    type: 'OLD' | 'NEW' | 'CONFLICT',
    newName: string,
    newMinutes: number
  ) => {
    const applyUpdate = (record: ExtractedRecord) => {
      if (record.id === id)
        return {
          ...record,
          name: newName,
          minutes: newMinutes,
          today_time: formatTimeStr(newMinutes)
        };
      return record;
    };

    if (type === 'OLD') setOldUsers((prev) => prev.map(applyUpdate));
    if (type === 'NEW') setNewUsers((prev) => prev.map(applyUpdate));
    if (type === 'CONFLICT') {
      setConflicts((prev) =>
        prev.map((group) => ({
          ...group,
          records: group.records.map(applyUpdate)
        }))
      );
    }
  };

  const handleDeleteFinalLog = async (logId: string) => {
    try {
      await db.delete(studyLogs).where(eq(studyLogs.id, logId));
      setRefreshKey((prev) => prev + 1);
      await recalculateAbsence(); // محاسبه پس از حذف لاگ
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در حذف لاگ پیش آمد.');
    }
  };

  const handleUpdateFinalLog = async (
    logId: string,
    memberId: string,
    newName: string,
    newMinutes: number
  ) => {
    try {
      const trimmedName = newName.trim();

      const currentMembers = await db
        .select()
        .from(members)
        .where(eq(members.groupId, groupId));

      const isDuplicate = currentMembers.some(
        (m) =>
          m.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          m.id !== memberId
      );

      if (isDuplicate) {
        Alert.alert(
          'تداخل نام',
          'این نام قبلاً برای شخص دیگری ثبت شده است. امکان تغییر نام به نام‌های تکراری وجود ندارد.'
        );
        return;
      }

      await db
        .update(studyLogs)
        .set({ studyMinutes: newMinutes })
        .where(eq(studyLogs.id, logId));

      await db
        .update(members)
        .set({ name: trimmedName })
        .where(eq(members.id, memberId));

      setRefreshKey((prev) => prev + 1);
      await recalculateAbsence(); // محاسبه پس از ویرایش لاگ
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ویرایش اطلاعات در دیتابیس پیش آمد.');
    }
  };

  return (
    <TimeTabPresentational
      selectedDate={activeDate}
      members={(groupMembers as unknown as Member[]) || []}
      onConfirmDate={handleConfirmDate}
      onEditDate={handleEditDate}
      onSubmitLog={handleSubmitLog}
      onExtractJson={handleExtractJson}
      isLoggingTime={isLoggingTime}
      extractedOldUsers={oldUsers}
      extractedNewUsers={newUsers}
      extractedConflicts={conflicts}
      onApproveExtracted={handleApproveExtracted}
      onApproveAllExtracted={handleApproveAllExtracted}
      onDeleteExtracted={handleDeleteExtracted}
      onUpdateExtracted={handleUpdateExtracted}
      finalLogs={finalLogs}
      onDeleteFinalLog={handleDeleteFinalLog}
      onUpdateFinalLog={handleUpdateFinalLog}
    />
  );
}
