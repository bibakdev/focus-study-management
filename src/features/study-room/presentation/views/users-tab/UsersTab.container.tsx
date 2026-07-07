// src/features/study-room/presentation/views/users-tab/UsersTab.container.tsx
import { db } from '@/core/database/db';
import { groups, members, memberTargets } from '@/core/database/schema';
import { getPersianDateStr } from '@/core/utils/date';
import { generateUUID } from '@/core/utils/uuid';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  Member,
  MemberTarget,
  MemberWithTarget
} from '../../../domain/entities/member';
import { calculateSingleMemberStats } from '../../../domain/use-cases/calculate-single-member-stats';
import {
  TimeInput,
  UserFormData,
  UserFormModal
} from '../../components/UserFormModal';
import { UsersTabPresentational } from './UsersTab.presentational';

interface UsersTabContainerProps {
  groupId: string;
}

const timeToMins = (time: TimeInput): number => {
  const h = parseInt(time.h) || 0;
  const m = parseInt(time.m) || 0;
  return h * 60 + m;
};

const formatMinToFa = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
  if (h > 0) return `${h} ساعت`;
  return `${m} دقیقه`;
};

const MAX_TARGET_MINUTES = 18 * 60;

const DAY_NAMES: Record<keyof UserFormData['weekly'], string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه'
};

export function UsersTabContainer({ groupId }: UsersTabContainerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    member: Member;
    target: MemberTarget;
  } | null>(null);

  const { data: groupData } = useLiveQuery(
    db.select().from(groups).where(eq(groups.id, groupId))
  );
  const currentGroup = groupData?.[0];
  const bananaThreshold = currentGroup?.bananaThreshold || 120;

  const { data: rawUsers } = useLiveQuery(
    db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId))
      .orderBy(desc(members.joinedAt))
  );
  const { data: rawTargets } = useLiveQuery(
    db.select().from(memberTargets).where(eq(memberTargets.groupId, groupId))
  );

  const usersWithTargets = useMemo(() => {
    if (!rawUsers || !rawTargets) return [];
    return (rawUsers as unknown as Member[]).map((user) => {
      const target = (rawTargets as unknown as MemberTarget[]).find(
        (t) => t.memberId === user.id
      );
      return { ...user, target: target || null } as MemberWithTarget;
    });
  }, [rawUsers, rawTargets]);

  const filteredUsers = useMemo(() => {
    return usersWithTargets.filter((user) => {
      return user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [usersWithTargets, searchQuery]);

  const handleAddUserPress = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  const handleEditUser = (user: MemberWithTarget) => {
    setEditingUser({ member: user, target: user.target as MemberTarget });
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (data: UserFormData) => {
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      Alert.alert('خطا', 'لطفاً نام کاربر را وارد کنید.');
      return;
    }

    const currentMembers = await db
      .select()
      .from(members)
      .where(eq(members.groupId, groupId));

    const isDuplicate = currentMembers.some(
      (m) =>
        m.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        m.id !== editingUser?.member.id
    );

    if (isDuplicate) {
      Alert.alert('کاربر تکراری', 'کاربری با این نام قبلاً در گروه وجود دارد.');
      return;
    }

    const thresholdStr = formatMinToFa(bananaThreshold);

    if (data.targetType === 'FIXED') {
      const mins = timeToMins(data.defaultTime);
      if (mins > 0 && mins < bananaThreshold) {
        Alert.alert(
          'خطای تارگت',
          `تارگت مطالعه نمی‌تواند از حداقل زمان تنظیم شده برای دریافت موز (${thresholdStr}) کمتر باشد.`
        );
        return;
      }
      if (mins > MAX_TARGET_MINUTES) {
        Alert.alert('خطا', 'تارگت مطالعه نمی‌تواند بیشتر از ۱۸ ساعت باشد.');
        return;
      }
    } else {
      for (const [dayKey, dayName] of Object.entries(DAY_NAMES)) {
        const mins = timeToMins(
          data.weekly[dayKey as keyof UserFormData['weekly']]
        );
        if (mins > 0 && mins < bananaThreshold) {
          Alert.alert(
            'خطای تارگت',
            `تارگت روز ${dayName} نمی‌تواند از حداقل زمان دریافت موز (${thresholdStr}) کمتر باشد.`
          );
          return;
        }
        if (mins > MAX_TARGET_MINUTES) {
          Alert.alert(
            'خطا',
            `تارگت مطالعه در روز ${dayName} نمی‌تواند بیشتر از ۱۸ ساعت باشد.`
          );
          return;
        }
      }
    }

    try {
      let activeMemberId = '';
      let isManualOptOut = false;
      let lastForgivenDate: string | null = null;

      if (editingUser) {
        const oldStatus = !!editingUser.member.inBananaChallenge;
        const newStatus = !!data.inBananaChallenge;

        isManualOptOut = !!editingUser.member.isManualOptOut;
        lastForgivenDate = editingUser.member.lastForgivenDate || null;

        if (oldStatus !== newStatus) {
          if (newStatus === false) {
            isManualOptOut = true;
          } else {
            isManualOptOut = false;
            lastForgivenDate = getPersianDateStr(new Date());
          }
        }
      } else {
        if (data.inBananaChallenge === false) isManualOptOut = true;
      }

      if (editingUser) {
        activeMemberId = editingUser.member.id;
        await db
          .update(members)
          .set({
            name: trimmedName,
            isActive: data.isActive,
            inBananaChallenge: data.inBananaChallenge,
            inGroupChallenge: data.inGroupChallenge, // 🔴 مقدار فرم اعمال می‌شود
            isManualOptOut: isManualOptOut,
            lastForgivenDate: lastForgivenDate,
            activeStreak: data.activeStreak,
            absenceDays: data.absenceDays
          })
          .where(eq(members.id, activeMemberId));

        await db
          .update(memberTargets)
          .set({
            targetType: data.targetType,
            defaultMinutes: timeToMins(data.defaultTime),
            saturdayMinutes: timeToMins(data.weekly.saturday),
            sundayMinutes: timeToMins(data.weekly.sunday),
            mondayMinutes: timeToMins(data.weekly.monday),
            tuesdayMinutes: timeToMins(data.weekly.tuesday),
            wednesdayMinutes: timeToMins(data.weekly.wednesday),
            thursdayMinutes: timeToMins(data.weekly.thursday),
            fridayMinutes: timeToMins(data.weekly.friday)
          })
          .where(eq(memberTargets.memberId, activeMemberId));
      } else {
        activeMemberId = generateUUID();

        await db.insert(members).values({
          id: activeMemberId,
          groupId,
          name: trimmedName,
          isActive: data.isActive,
          inBananaChallenge: data.inBananaChallenge,
          inGroupChallenge: data.inGroupChallenge, // 🔴 مقدار فرم اعمال می‌شود
          isManualOptOut: isManualOptOut,
          lastForgivenDate: lastForgivenDate,
          activeStreak: data.activeStreak,
          highestActiveStreak: 0,
          absenceDays: data.absenceDays,
          consecutiveEggplants: 0,
          personalRecordMinutes: 0,
          totalCheckmarks: 0,
          totalBananas: 0,
          totalEggplants: 0,
          teamFirstPlaces: 0,
          teamSecondPlaces: 0,
          teamThirdPlaces: 0,
          teamChampionships: 0,
          joinedAt: new Date()
        });

        await db.insert(memberTargets).values({
          id: generateUUID(),
          memberId: activeMemberId,
          groupId,
          targetType: data.targetType,
          defaultMinutes: timeToMins(data.defaultTime),
          saturdayMinutes: timeToMins(data.weekly.saturday),
          sundayMinutes: timeToMins(data.weekly.sunday),
          mondayMinutes: timeToMins(data.weekly.monday),
          tuesdayMinutes: timeToMins(data.weekly.tuesday),
          wednesdayMinutes: timeToMins(data.weekly.wednesday),
          thursdayMinutes: timeToMins(data.weekly.thursday),
          fridayMinutes: timeToMins(data.weekly.friday)
        });
      }

      await calculateSingleMemberStats(groupId, activeMemberId);

      handleCloseModal();
      setSearchQuery('');
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('خطا', 'مشکلی در ذخیره اطلاعات پیش آمد.');
    }
  };

  const handleDeleteUser = (user: MemberWithTarget) => {
    Alert.alert('حذف کاربر', `آیا از حذف "${user.name}" اطمینان دارید؟`, [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(members).where(eq(members.id, user.id));
          } catch (error) {
            Alert.alert('خطا', 'مشکلی در حذف کاربر پیش آمد.');
          }
        }
      }
    ]);
  };

  return (
    <>
      <UsersTabPresentational
        users={filteredUsers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddUserPress={handleAddUserPress}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      <UserFormModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSaveUser}
        initialData={editingUser}
      />
    </>
  );
}
