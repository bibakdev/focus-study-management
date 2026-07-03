import { BottomNav, TabType } from '@/shared/components/navigation/BottomNav';
import { View } from 'react-native';
import { Group } from '../../../domain/entities/group';
import { RoomHeader } from '../../components/RoomHeader';
import { UsersTab } from '../users-tab';

export interface RoomDetailPresentationalProps {
  currentGroup: Group | null;
  allGroups: Group[];
  activeTab: TabType;
  onGroupSelect: (groupId: string) => void;
  onManageGroupsPress: () => void;
  onTabPress: (tab: TabType) => void;
}

export function RoomDetailPresentational({
  currentGroup,
  allGroups,
  activeTab,
  onGroupSelect,
  onManageGroupsPress,
  onTabPress
}: RoomDetailPresentationalProps) {
  return (
    <View className="flex-1 bg-surface-main w-full max-w-md mx-auto">
      {/* 1. بلوک هدر */}
      <RoomHeader
        currentGroup={currentGroup}
        allGroups={allGroups}
        onGroupSelect={onGroupSelect}
        onManageGroupsPress={onManageGroupsPress}
      />

      {/* 2. بلوک محتوای اصلی */}
      <View className="flex-1 px-5 z-0">
        {currentGroup && activeTab === 'users' && (
          <UsersTab groupId={currentGroup.id} />
        )}
        {/* سایر تب‌ها در آینده اینجا اضافه می‌شوند */}
      </View>

      {/* 3. بلوک نوار ناوبری پایین (Footer) */}
      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}
