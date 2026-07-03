import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { TextInputWithIcon } from '@/shared/components/inputs/TextInputWithIcon';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Text, View } from 'react-native';
import { MemberWithTarget } from '../../../domain/entities/member';
import { UserCard } from '../../components/UserCard';

interface UsersTabPresentationalProps {
  users: MemberWithTarget[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddUserPress: () => void;
  onEditUser: (user: MemberWithTarget) => void;
  onDeleteUser: (user: MemberWithTarget) => void;
}

export function UsersTabPresentational({
  users,
  searchQuery,
  onSearchChange,
  onAddUserPress,
  onEditUser,
  onDeleteUser
}: UsersTabPresentationalProps) {
  return (
    <View className="flex-1 w-full pt-6">
      <View className="mb-4">
        <View className="mb-4">
          <PrimaryActionButton
            label="افزودن کاربر جدید"
            iconName="person-add"
            onPress={onAddUserPress}
          />
        </View>
        <View className="mb-2">
          <TextInputWithIcon
            iconName="search"
            placeholder="جستجوی نام کاربر..."
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <View className="w-16 h-16 bg-surface-muted rounded-full items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#94a3b8" />
            </View>
            <Text className="text-text-secondary font-bold text-lg font-main mb-2">
              کاربری یافت نشد
            </Text>
            <Text className="text-text-muted text-sm font-main text-center">
              با جستجوی نام یا افزودن کاربر جدید شروع کنید.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <UserCard user={item} onEdit={onEditUser} onDelete={onDeleteUser} />
        )}
      />
    </View>
  );
}
