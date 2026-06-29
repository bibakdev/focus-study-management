// src/features/study-room/presentation/views/group-list/GroupList.presentational.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Header } from '../../components/Header';
import { GroupCard } from '../../components/GroupCard';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { Group } from '../../../domain/entities/group';

export interface GroupListPresentationalProps {
  groups: Group[];
  onAddGroupPress: () => void;
  onGroupPress: (group: Group) => void;
  onSettingsPress: () => void;
}

export function GroupListPresentational({
  groups,
  onAddGroupPress,
  onGroupPress,
  onSettingsPress
}: GroupListPresentationalProps) {
  return (
    <View className="flex-1 bg-slate-50 w-full max-w-md mx-auto">
      {/* هدر ثابت */}
      <Header title="گروه‌های من" onSettingsPress={onSettingsPress} />

      {/* محتوای اسکرول شونده */}
      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: 100 }} // برای دکمه‌های پایینی و باتم نویگیشن
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <GroupCard key={group.id} group={group} onPress={onGroupPress} />
          ))
        )}
      </ScrollView>

      {/* دکمه ایجاد گروه (ثابت در پایین) */}
      <View className="absolute bottom-6 left-5 right-5">
        <PrimaryActionButton
          label="ساخت گروه جدید"
          iconName="plus"
          onPress={onAddGroupPress}
        />
      </View>
    </View>
  );
}
