import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { TextInputWithIcon } from '@/shared/components/inputs/TextInputWithIcon';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

// تابع محاسباتی دقیق برای پیدا کردن روز هفته از روی تاریخ شمسی
const getPersianWeekday = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';

  const isLeap = (year: number) => {
    const r = year % 33;
    return (
      r === 1 ||
      r === 5 ||
      r === 9 ||
      r === 13 ||
      r === 17 ||
      r === 22 ||
      r === 26 ||
      r === 30
    );
  };

  let days = 0;

  if (y >= 1400) {
    for (let i = 1400; i < y; i++) {
      days += isLeap(i) ? 366 : 365;
    }
  } else {
    for (let i = y; i < 1400; i++) {
      days -= isLeap(i) ? 366 : 365;
    }
  }

  for (let i = 1; i < m; i++) {
    if (i <= 6) days += 31;
    else if (i <= 11) days += 30;
  }

  days += d - 1;

  const weekdays = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه'
  ];

  let wd = days % 7;
  if (wd < 0) wd += 7;

  return weekdays[wd];
};

interface DateSelectorProps {
  selectedDate: string | null;
  onConfirm: (date: string) => void;
  onEdit: () => void;
}

export function DateSelector({
  selectedDate,
  onConfirm,
  onEdit
}: DateSelectorProps) {
  const [inputValue, setInputValue] = useState(selectedDate || '');

  // تولید تاریخ با اعداد انگلیسی
  const getIRSTPersianDate = (offsetDays: number = 0) => {
    const now = new Date();
    const iranTime = new Date(now.getTime() + 3.5 * 60 * 60 * 1000);
    iranTime.setUTCHours(0, 0, 0, 0);
    iranTime.setUTCDate(iranTime.getUTCDate() + offsetDays);

    return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      calendar: 'persian',
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(iranTime);
  };

  const handleSetToday = () => {
    setInputValue(getIRSTPersianDate(-1));
  };

  const handleSetYesterday = () => {
    setInputValue(getIRSTPersianDate(-2));
  };

  const handleConfirm = () => {
    const regex = /^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/;
    if (!regex.test(inputValue.trim())) {
      alert(
        'فرمت تاریخ نامعتبر است. لطفاً از اعداد انگلیسی و فرمت سال/ماه/روز استفاده کنید (مثال: 1403/05/12).'
      );
      return;
    }

    Keyboard.dismiss();
    onConfirm(inputValue.trim());
  };

  // رندر حالت فشرده (دقیقاً مطابق با تصویر: بک‌گراند فلت و یک‌دست)
  if (selectedDate) {
    const weekdayName = getPersianWeekday(selectedDate);

    return (
      <Animated.View
        layout={Layout.springify().damping(15)}
        entering={FadeIn}
        exiting={FadeOut}
        className="bg-primary-light/30 border border-primary-light/50 rounded-3xl p-4 flex-row items-center justify-between"
      >
        {/* سمت چپ: دکمه تغییر تاریخ */}
        <Pressable
          onPress={onEdit}
          className="bg-surface-card px-4 py-2 rounded-xl active:scale-95 transition-transform border border-primary-light/50"
        >
          <Text className="text-primary-main text-xs font-bold font-main">
            تغییر تاریخ
          </Text>
        </Pressable>

        {/* سمت راست: متن اطلاعات */}
        <View className="items-end">
          <Text className="text-primary-main/70 text-[11px] font-main font-bold mb-1">
            در حال ثبت اطلاعات برای:
          </Text>
          <Text
            className="text-primary-main font-bold text-base font-main"
            style={{ direction: 'rtl' }}
          >
            {selectedDate} ({weekdayName})
          </Text>
        </View>
      </Animated.View>
    );
  }

  // رندر حالت فرم ورود
  return (
    <Animated.View
      layout={Layout.springify().damping(15)}
      entering={FadeIn}
      className="bg-surface-card rounded-3xl p-5 shadow-sm border border-surface-muted"
    >
      <View className="flex-row items-center gap-2 mb-4">
        <Ionicons name="calendar-outline" size={24} color="#4f46e5" />
        <Text className="text-text-primary font-bold text-lg font-main">
          ثبت تاریخ روز رقابت
        </Text>
      </View>

      <TextInputWithIcon
        iconName="calendar"
        placeholder="مثال: 1403/08/15"
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="numeric"
      />

      <View className="flex-row gap-3 mt-4 mb-6">
        <Pressable
          onPress={handleSetYesterday}
          className="flex-1 bg-surface-muted py-3 rounded-xl items-center active:bg-slate-200 active:scale-95 transition-all"
        >
          <Text className="text-text-secondary font-bold font-main text-sm">
            دیروز
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSetToday}
          className="flex-1 bg-primary-light/50 py-3 rounded-xl items-center active:bg-primary-light active:scale-95 transition-all"
        >
          <Text className="text-primary-main font-bold font-main text-sm">
            امروز
          </Text>
        </Pressable>
      </View>

      <PrimaryActionButton
        label="تایید و ذخیره تاریخ"
        iconName="save-outline"
        onPress={handleConfirm}
        disabled={!inputValue.trim()}
      />
    </Animated.View>
  );
}
