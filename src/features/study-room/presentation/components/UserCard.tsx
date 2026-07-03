import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { MemberWithTarget } from '../../../domain/entities/member';

interface UserCardProps {
  user: MemberWithTarget;
  onEdit: (user: MemberWithTarget) => void;
  onDelete: (user: MemberWithTarget) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  // حرف اول نام برای آواتار
  const firstChar = user.name.charAt(0).toUpperCase();

  // تاریخ عضویت شمسی
  const joinDate = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(user.joinedAt));

  // تبدیل دقیقه به فرمت ساعت:دقیقه (مثلاً 2:10 یا 0:45)
  const formatTime = (minutes: number) => {
    if (!minutes) return '0:00';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    // اضافه کردن صفر قبل از اعداد یک رقمی برای دقیقه
    const paddedMinutes = m.toString().padStart(2, '0');
    return `${h}:${paddedMinutes}`;
  };

  // محاسبه تارگت امروز
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
  const daysInStatus = user.isActive ? user.activeStreak : user.absenceDays;

  return (
    <View className="bg-surface-card rounded-2xl p-4 mb-4 shadow-sm border border-surface-muted">
      {/* ردیف اول: وضعیت (چپ) و هویت کاربر (راست) */}
      <View className="flex-row justify-between items-start mb-3">
        {/* سمت چپ: وضعیت و تعداد روز */}
        <View className="items-start">
          <View
            className={`flex-row items-center px-2.5 py-1 rounded-lg ${user.isActive ? 'bg-status-success-light' : 'bg-status-danger-light'}`}
          >
            <Text
              className={`text-xs font-bold font-main mr-1.5 ${user.isActive ? 'text-status-success-main' : 'text-status-danger-main'}`}
            >
              {user.isActive ? 'فعال' : 'غیرفعال'}
            </Text>
            <View
              className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-status-success-main' : 'bg-status-danger-main'}`}
            />
          </View>
          <Text className="text-[10px] text-text-muted font-main mt-1.5 ml-1">
            {daysInStatus} روز در این وضعیت
          </Text>
        </View>

        {/* سمت راست: آیکون موز (در صورت شرکت در چالش) + نام + آواتار */}
        <View className="flex-row items-center gap-2">
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

      {/* ردیف دوم: آمار و ارقام (تارگت، استمرار، تاریخ) */}
      <View className="flex-row flex-wrap justify-end gap-2 mb-4">
        {/* تاریخ عضویت */}
        <View className="flex-row items-center bg-surface-muted px-2.5 py-1.5 rounded-lg gap-1.5">
          <Text className="text-xs font-main text-text-secondary">
            {joinDate}
          </Text>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
        </View>

        {/* استمرار */}
        <View className="flex-row items-center bg-badge-streak-light px-2.5 py-1.5 rounded-lg gap-1.5">
          <Text className="text-xs font-bold font-main text-badge-streak-main">
            استمرار: {user.activeStreak} روز
          </Text>
          <Text className="text-xs">🔥</Text>
        </View>

        {/* تارگت امروز */}
        <View className="flex-row items-center bg-primary-light/30 px-2.5 py-1.5 rounded-lg gap-1.5">
          <Text className="text-xs font-bold font-main text-primary-main">
            تارگت امروز: {targetDisplay}
          </Text>
          <Ionicons name="time-outline" size={14} color="#4f46e5" />
        </View>
      </View>

      {/* ردیف سوم: دکمه‌های عملیاتی */}
      <View className="flex-row items-center justify-start gap-3 pt-3 border-t border-surface-muted">
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
    </View>
  );
}
