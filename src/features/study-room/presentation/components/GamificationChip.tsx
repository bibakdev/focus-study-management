import { Text, View } from 'react-native';

interface GamificationChipProps {
  type: 'target' | 'streak' | 'muzi' | 'absence';
  value: string | number;
}

export function GamificationChip({ type, value }: GamificationChipProps) {
  const config = {
    target: {
      bg: 'bg-primary-light/50',
      text: 'text-primary-main',
      icon: '🎯'
    },
    streak: {
      bg: 'bg-badge-streak-light',
      text: 'text-badge-streak-main',
      icon: '🔥'
    },
    muzi: {
      bg: 'bg-badge-muzi-light',
      text: 'text-badge-muzi-main',
      icon: '🍌'
    },
    absence: {
      bg: 'bg-status-danger-light',
      text: 'text-status-danger-main',
      icon: '💤'
    }
  };

  const current = config[type];

  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-lg gap-1 ${current.bg}`}
    >
      <Text className="text-xs">{current.icon}</Text>
      <Text className={`text-xs font-bold font-main ${current.text}`}>
        {value}
      </Text>
    </View>
  );
}
