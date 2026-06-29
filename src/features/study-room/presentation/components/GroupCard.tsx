// src/features/study-room/presentation/components/GroupCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Group } from '../../domain/entities/group';

interface GroupCardProps {
  group: Group;
  onPress: (group: Group) => void;
}

// تابع کمکی برای اختصاص یک رنگ ثابت بر اساس حرف اول نام گروه
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-50 text-blue-600',
    'bg-purple-50 text-purple-600',
    'bg-rose-50 text-rose-600',
    'bg-emerald-50 text-emerald-600'
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export function GroupCard({ group, onPress }: GroupCardProps) {
  const avatarStyle = getAvatarColor(group.name);
  const firstChar = group.name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => onPress(group)}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm active:scale-95 transition-all duration-200 border border-slate-100"
    >
      {/* آیکون پیکان ورود */}
      <SymbolView
        name="chevron.left"
        size={16}
        tintColor="#94a3b8"
        weight="bold"
      />

      <View className="flex-1 mr-4">
        <Text className="text-slate-800 font-bold text-lg text-right font-[Vazirmatn] mb-1">
          {group.name}
        </Text>

        {/* آمار گروه */}
        <View className="flex-row justify-end items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Text className="text-slate-500 text-xs font-[Vazirmatn]">
              موز: {group.bananaThreshold}د
            </Text>
            <SymbolView name="clock.fill" size={12} tintColor="#f59e0b" />
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-slate-500 text-xs font-[Vazirmatn]">
              بادمجون: {group.eggplantThreshold}د
            </Text>
            <SymbolView
              name="exclamationmark.triangle.fill"
              size={12}
              tintColor="#8b5cf6"
            />
          </View>
        </View>
      </View>

      {/* آواتار گروه */}
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${avatarStyle.split(' ')[0]}`}
      >
        <Text
          className={`text-xl font-bold font-[Vazirmatn] ${avatarStyle.split(' ')[1]}`}
        >
          {firstChar}
        </Text>
      </View>
    </Pressable>
  );
}
