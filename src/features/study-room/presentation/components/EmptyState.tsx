// src/features/study-room/presentation/components/EmptyState.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center pt-20 px-6">
      <View className="w-24 h-24 bg-indigo-50 rounded-full items-center justify-center mb-6">
        <SymbolView name="person.3.fill" size={40} tintColor="#4f46e5" />
      </View>
      <Text className="text-slate-800 font-bold text-xl mb-2 text-center font-[Vazirmatn]">
        گروهی پیدا نشد!
      </Text>
      <Text className="text-slate-500 text-sm text-center leading-6 font-[Vazirmatn]">
        شما هنوز عضو هیچ اتاق مطالعه‌ای نیستید. با لمس دکمه پایین اولین گروه
        رقابتی خود را بسازید.
      </Text>
    </View>
  );
}
