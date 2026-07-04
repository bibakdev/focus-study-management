import React from 'react';
import { View, ScrollView } from 'react-native';
import { DateSelector } from '../../components/DateSelector';

interface TimeTabPresentationalProps {
  selectedDate: string | null;
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
}

export function TimeTabPresentational({
  selectedDate,
  onConfirmDate,
  onEditDate
}: TimeTabPresentationalProps) {
  return (
    <View className="flex-1 w-full pt-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <DateSelector
          selectedDate={selectedDate}
          onConfirm={onConfirmDate}
          onEdit={onEditDate}
        />

        {selectedDate && (
          <View className="mt-6">
            {/* فرم‌های ثبت زمان اعضا در فاز بعدی اینجا اضافه خواهند شد */}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
