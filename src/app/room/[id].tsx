import { RoomDetail } from '@/features/study-room/presentation/views/room-detail';
import { View } from 'react-native';

export default function RoomScreen() {
  return (
    <View className="flex-1 bg-surface-main">
      <RoomDetail />
    </View>
  );
}
