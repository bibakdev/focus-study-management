// src/app/index.tsx
import { GroupList } from '@/features/study-room/presentation/views/group-list';
import { View } from 'react-native';

export default function IndexScreen() {
  return (
    // استفاده از رنگ بک‌گراند اصلی دیزاین سیستم برای روت برنامه
    <View className="flex-1 bg-slate-50">
      <GroupList />
    </View>
  );
}
