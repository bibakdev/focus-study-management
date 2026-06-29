// src/features/study-room/presentation/components/Header.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassIconButton } from '@/shared/components/buttons/GlassIconButton';

interface HeaderProps {
  title: string;
  onSettingsPress?: () => void;
}

export function Header({ title, onSettingsPress }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-indigo-600 rounded-b-3xl shadow-md px-5 pb-6"
      style={{ paddingTop: Math.max(insets.top, 20) + 16 }} // رعایت Safe Area
    >
      <View className="flex-row items-center justify-between">
        <GlassIconButton iconName="gearshape.fill" onPress={onSettingsPress} />
        <Text className="text-white text-xl font-bold font-[Vazirmatn]">
          {title}
        </Text>
        {/* یک View خالی برای تراز کردن عنوان در مرکز (Space-between) */}
        <View className="w-10" />
      </View>
    </View>
  );
}
