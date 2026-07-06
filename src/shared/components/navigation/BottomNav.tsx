import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType =
  | 'users'
  | 'time'
  | 'ranking'
  | 'banana'
  | 'group-challenge';

interface BottomNavProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      id: 'users',
      label: 'کاربران',
      activeIcon: 'people',
      inactiveIcon: 'people-outline'
    },
    {
      id: 'time',
      label: 'ساعت',
      activeIcon: 'time',
      inactiveIcon: 'time-outline'
    },
    {
      id: 'ranking',
      label: 'رتبه‌بندی',
      activeIcon: 'trophy',
      inactiveIcon: 'trophy-outline'
    },
    { id: 'banana', label: 'چالش موزی', isEmoji: true, emoji: '🍌' },
    { id: 'group-challenge', label: 'رقابت تیمی', isEmoji: true, emoji: '⚔️' }
  ] as const;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-surface-card border-t border-surface-muted rounded-t-3xl flex-row justify-around items-center pt-3 shadow-lg z-20"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id as TabType)}
            className="flex-1 items-center justify-center active:scale-95 transition-transform"
          >
            <View
              className={`items-center justify-center w-14 h-8 rounded-full mb-1 transition-colors ${
                isActive ? 'bg-primary-light/50' : 'bg-transparent'
              }`}
            >
              {tab.isEmoji ? (
                <Text
                  className={`text-xl ${isActive ? 'opacity-100' : 'opacity-50'}`}
                >
                  {tab.emoji}
                </Text>
              ) : (
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={22}
                  color={isActive ? '#4f46e5' : '#64748b'}
                />
              )}
            </View>

            <Text
              className={`text-[10px] font-main font-bold transition-colors ${
                isActive ? 'text-primary-main' : 'text-text-muted'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
