import { db } from '@/core/database/db';
import { groups } from '@/core/database/schema';
import { TabType } from '@/shared/components/navigation/BottomNav';
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Group } from '../../../domain/entities/group';
import { RoomDetailPresentational } from './RoomDetail.presentational';

export function RoomDetailContainer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: allGroupsData } = useLiveQuery(
    db.select().from(groups).orderBy(desc(groups.createdAt))
  );

  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  // استیت مدیریت تب فعال (پیش‌فرض روی کاربران)
  const [activeTab, setActiveTab] = useState<TabType>('users');

  useEffect(() => {
    if (allGroupsData && allGroupsData.length > 0) {
      const activeGroup = allGroupsData.find((g) => g.id === id);
      if (activeGroup) {
        setCurrentGroup(activeGroup as unknown as Group);
      }
    }
  }, [id, allGroupsData]);

  const handleGroupSelect = (newGroupId: string) => {
    router.replace(`/room/${newGroupId}`);
  };

  // هدایت به صفحه مدیریت گروه‌ها
  const handleManageGroupsPress = () => {
    router.push('/groups');
  };

  // هندلر تغییر تب
  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <RoomDetailPresentational
      currentGroup={currentGroup}
      allGroups={(allGroupsData as unknown as Group[]) || []}
      activeTab={activeTab}
      onGroupSelect={handleGroupSelect}
      onManageGroupsPress={handleManageGroupsPress}
      onTabPress={handleTabPress}
    />
  );
}
