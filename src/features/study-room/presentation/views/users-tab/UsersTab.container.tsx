import { db } from '@/core/database/db';
import { members, memberTargets } from '@/core/database/schema';
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

    if (data.targetType === 'FIXED') {
      if (timeToMins(data.defaultTime) > MAX_TARGET_MINUTES) {
        Alert.alert('خطا', 'تارگت مطالعه نمی‌تواند بیشتر از ۱۸ ساعت باشد.');
        return;
      }
    } else {
      for (const [dayKey, dayName] of Object.entries(DAY_NAMES)) {
        if (
          timeToMins(data.weekly[dayKey as keyof UserFormData['weekly']]) >
          MAX_TARGET_MINUTES
        ) {
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

      if (editingUser) {
        activeMemberId = editingUser.member.id;
        await db
          .update(members)
          .set({
            name: trimmedName,
            isActive: data.isActive,
            inBananaChallenge: data.inBananaChallenge,
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
          activeStreak: data.activeStreak,
          highestActiveStreak: 0,
          absenceDays: data.absenceDays,
          consecutiveEggplants: 0,
          personalRecordMinutes: 0,
          totalCheckmarks: 0,
          totalBananas: 0,
          totalEggplants: 0,
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

      // 🔥 اجرای هوک افزایشی فقط برای همین کاربر برای آپدیت اعداد در دیتابیس
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
