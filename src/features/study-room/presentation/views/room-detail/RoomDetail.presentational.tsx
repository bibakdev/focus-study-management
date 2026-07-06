import { BottomNav, TabType } from '@/shared/components/navigation/BottomNav';
import { View } from 'react-native';
import { Group } from '../../../domain/entities/group';
import { RoomHeader } from '../../components/RoomHeader';
import { BananaTab } from '../banana-tab';
import { GroupChallengeTab } from '../group-challenge-tab';
import { RankingTab } from '../ranking-tab';
import { TimeTab } from '../time-tab';
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
      <RoomHeader
        currentGroup={currentGroup}
        allGroups={allGroups}
        onGroupSelect={onGroupSelect}
        onManageGroupsPress={onManageGroupsPress}
      />

      <View className="flex-1 px-5 z-0">
        <View className={activeTab === 'users' ? 'flex-1' : 'hidden'}>
          {currentGroup && <UsersTab groupId={currentGroup.id} />}
        </View>

        <View className={activeTab === 'time' ? 'flex-1' : 'hidden'}>
          {currentGroup && <TimeTab groupId={currentGroup.id} />}
        </View>

        <View className={activeTab === 'ranking' ? 'flex-1' : 'hidden'}>
          {currentGroup && <RankingTab groupId={currentGroup.id} />}
        </View>

        <View className={activeTab === 'banana' ? 'flex-1' : 'hidden'}>
          {currentGroup && <BananaTab groupId={currentGroup.id} />}
        </View>

        <View className={activeTab === 'group-challenge' ? 'flex-1' : 'hidden'}>
          {currentGroup && <GroupChallengeTab groupId={currentGroup.id} />}
        </View>
      </View>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}
