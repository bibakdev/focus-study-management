// src/features/study-room/presentation/components/UserCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { MemberWithTarget } from '../../../domain/entities/member';

interface UserCardProps {
  user: MemberWithTarget;
  onEdit: (user: MemberWithTarget) => void;
  onDelete: (user: MemberWithTarget) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstChar = user.name.charAt(0).toUpperCase();

  const joinDate = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(user.joinedAt));

  const formatTime = (minutes: number) => {
    if (!minutes) return '0:00';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const paddedMinutes = m.toString().padStart(2, '0');
    return `${h}:${paddedMinutes}`;
  };

  const getTodayTarget = () => {
    if (!user.target) return formatTime(0);
    if (user.target.targetType === 'FIXED')
      return formatTime(user.target.defaultMinutes);

    const today = new Date().getDay();
    const weeklyTargets = {
      0: user.target.sundayMinutes,
      1: user.target.mondayMinutes,
      2: user.target.tuesdayMinutes,
      3: user.target.wednesdayMinutes,
      4: user.target.thursdayMinutes,
      5: user.target.fridayMinutes,
      6: user.target.saturdayMinutes
    };
    return formatTime(weeklyTargets[today as keyof typeof weeklyTargets] || 0);
  };

  const targetDisplay = getTodayTarget();
  const statusText = user.isActive ? 'فعال' : 'غیرفعال';

  return (
    <Animated.View
      layout={Layout.springify().damping(20).stiffness(90)}
      className="bg-surface-card rounded-2xl p-4 mb-4 shadow-sm border border-surface-muted overflow-hidden"
    >
      {/* هدر اصلی (همیشه قابل مشاهده) */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="active:opacity-70"
      >
        <View className="flex-row justify-between items-start mb-1">
          <View className="items-start">
            <View
              className={`flex-row items-center px-2.5 py-1 rounded-lg ${user.isActive ? 'bg-status-success-light' : 'bg-status-danger-light'}`}
            >
              <Text
                className={`text-xs font-bold font-main mr-1.5 ${user.isActive ? 'text-status-success-main' : 'text-status-danger-main'}`}
              >
                {statusText}
              </Text>
              <View
                className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-status-success-main' : 'bg-status-danger-main'}`}
              />
            </View>
            {!user.isActive && (
              <Text className="text-[10px] text-text-muted font-main mt-1.5 ml-1">
                {user.absenceDays} روز غیبت متوالی
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {user.inGroupChallenge && <Text className="text-lg">⚔️</Text>}
            {user.inBananaChallenge && <Text className="text-lg">🍌</Text>}
            <Text className="text-text-primary font-bold text-lg font-main">
              {user.name}
            </Text>
            <View className="w-10 h-10 bg-primary-light rounded-full items-center justify-center">
              <Text className="text-primary-main font-bold text-lg font-main">
                {firstChar}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* بخش باز شونده (آمار و ارقام - در سه ردیف مجزا) */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <View className="mt-4 mb-2 gap-3">
            {/* ردیف اول: آمار چالش موزی (موز، بادمجان، تیک) */}
            <View className="flex-row justify-end gap-2 w-full">
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.totalEggplants || 0}
                </Text>
                <Text className="text-xs">🍆</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.totalBananas || 0}
                </Text>
                <Text className="text-xs">🍌</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.totalCheckmarks || 0}
                </Text>
                <Text className="text-xs">✅</Text>
              </View>
            </View>

            {/* ردیف دوم: افتخارات تیمی */}
            <View className="flex-row justify-end gap-2 w-full">
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.teamChampionships || 0}
                </Text>
                <Text className="text-xs">🎖</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.teamThirdPlaces || 0}
                </Text>
                <Text className="text-xs">🥉</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.teamSecondPlaces || 0}
                </Text>
                <Text className="text-xs">🥈</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-slate-700">
                  {user.teamFirstPlaces || 0}
                </Text>
                <Text className="text-xs">🥇</Text>
              </View>
            </View>

            {/* ردیف سوم: سایر وضعیت‌ها و اطلاعات */}
            <View className="flex-row flex-wrap justify-end gap-2 w-full">
              <View className="flex-row items-center bg-surface-muted px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-main text-text-secondary">
                  {joinDate}
                </Text>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
              </View>

              <View className="flex-row items-center bg-primary-light/30 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-primary-main">
                  تارگت امروز: {targetDisplay}
                </Text>
                <Ionicons name="time-outline" size={14} color="#4f46e5" />
              </View>

              <View className="flex-row items-center bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-amber-600">
                  بیشترین رکورد: {formatTime(user.personalRecordMinutes || 0)}
                </Text>
                <Text className="text-xs">🏆</Text>
              </View>

              <View className="flex-row items-center bg-badge-streak-light px-2.5 py-1.5 rounded-lg gap-1.5">
                <Text className="text-xs font-bold font-main text-badge-streak-main">
                  بیشترین استمرار:{' '}
                  {user.highestActiveStreak || user.activeStreak || 0} روز
                </Text>
                <Text className="text-xs">🔥</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* اکشن‌های پایین کارت */}
      <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-surface-muted">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => onDelete(user)}
            className="flex-row items-center bg-status-danger-light px-3 py-2 rounded-xl gap-1.5 active:scale-95 transition-transform"
          >
            <Text className="text-sm font-bold font-main text-status-danger-main">
              حذف
            </Text>
            <Ionicons name="trash-outline" size={16} color="#f43f5e" />
          </Pressable>

          <Pressable
            onPress={() => onEdit(user)}
            className="flex-row items-center bg-primary-light/50 px-3 py-2 rounded-xl gap-1.5 active:scale-95 transition-transform"
          >
            <Text className="text-sm font-bold font-main text-primary-main">
              ویرایش
            </Text>
            <Ionicons name="create-outline" size={16} color="#4f46e5" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="p-1 active:bg-slate-50 rounded-full"
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color="#94a3b8"
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}
