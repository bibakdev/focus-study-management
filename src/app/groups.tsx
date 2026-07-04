import { GroupList } from '@/features/study-room/presentation/views/group-list';
import { View } from 'react-native';

export default function GroupsScreen() {
  return (
    // صفحه مدیریت گروه‌ها
    <View className="flex-1 bg-slate-50">
      <GroupList />
    </View>
  );
}
