import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Member } from '../../../domain/entities/member';

interface ManualTimeEntryProps {
  members?: Member[];
  onSubmit: (data: {
    memberId?: string;
    name: string;
    minutes: number;
  }) => void;
  isLoading?: boolean;
}

export function ManualTimeEntry({
  members = [],
  onSubmit,
  isLoading
}: ManualTimeEntryProps) {
  // استیت برای مدیریت باز و بسته بودن باکس (به صورت پیش‌فرض بسته است)
  const [isExpanded, setIsExpanded] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  const [selectedMemberId, setSelectedMemberId] = useState<
    string | undefined
  >();
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredMembers = members.filter(
    (m) => m.name && m.name.toLowerCase().includes(nameInput.toLowerCase())
  );

  useEffect(() => {
    if (selectedMemberId) {
      const matched = members.find((m) => m.id === selectedMemberId);
      if (matched && matched.name !== nameInput) {
        setSelectedMemberId(undefined);
      }
    }
  }, [nameInput, members, selectedMemberId]);

  const handleSelectMember = (member: Member) => {
    setNameInput(member.name);
    setSelectedMemberId(member.id);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleSubmit = () => {
    if (!nameInput.trim()) {
      alert('لطفاً نام کاربر را وارد کنید.');
      return;
    }

    const h = parseInt(hourInput.trim(), 10) || 0;
    const m = parseInt(minuteInput.trim(), 10) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes === 0) {
      alert('لطفاً زمان معتبری وارد کنید.');
      return;
    }

    if (m >= 60) {
      alert('دقیقه نمی‌تواند بیشتر از ۵۹ باشد.');
      return;
    }

    onSubmit({
      memberId: selectedMemberId,
      name: nameInput.trim(),
      minutes: totalMinutes
    });

    setNameInput('');
    setHourInput('');
    setMinuteInput('');
    setSelectedMemberId(undefined);
    Keyboard.dismiss();

    // در صورت تمایل می‌توانید پس از ثبت موفق، فرم را ببندید:
    // setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Keyboard.dismiss(); // بستن کیبورد در صورت باز بودن هنگام جمع کردن فرم
  };

  return (
    <Animated.View
      layout={Layout.springify().damping(15)}
      className="bg-surface-card rounded-3xl p-5 shadow-sm border border-surface-muted mt-4 overflow-hidden"
    >
      {/* هدر قابل کلیک */}
      <Pressable
        onPress={toggleExpand}
        className="flex-row justify-end items-center gap-2 active:opacity-70 transition-opacity"
      >
        <Text className="text-text-primary font-bold text-base font-main">
          ثبت دستی کاربر
        </Text>
        {/* تغییر آیکون بر اساس وضعیت باز یا بسته بودن */}
        <Ionicons
          name={isExpanded ? 'remove' : 'add'}
          size={20}
          color="#10b981"
        />
      </Pressable>

      {/* محتوای فرم که در صورت isExpanded رندر و انیمیت می‌شود */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="mt-5"
        >
          {/* فیلدهای ورودی */}
          <View className="flex-row gap-3 relative z-10">
            {/* فیلد ترکیبی زمان (ساعت و دقیقه) */}
            <View
              className="flex-row items-center justify-center bg-surface-main border border-status-success-main rounded-xl px-2 h-[46px] w-[90px]"
              style={{ direction: 'ltr' }}
            >
              <TextInput
                className="w-7 text-text-primary text-sm font-main font-bold"
                style={{ textAlign: 'center', outlineStyle: 'none' } as any}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={2}
                value={hourInput}
                onChangeText={setHourInput}
              />

              <Text className="text-status-success-main font-bold pb-1">:</Text>

              <TextInput
                className="w-7 text-text-primary text-sm font-main font-bold"
                style={{ textAlign: 'center', outlineStyle: 'none' } as any}
                placeholder="00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={2}
                value={minuteInput}
                onChangeText={setMinuteInput}
              />
            </View>

            {/* فیلد نام کاربر */}
            <View className="flex-1">
              <TextInput
                className="w-full bg-surface-main border border-surface-muted rounded-xl px-3 h-[46px] text-text-primary text-sm font-main focus:border-primary-main focus:bg-primary-light/10 transition-colors"
                style={{ textAlign: 'right', outlineStyle: 'none' } as any}
                placeholder="نام کاربر (جستجو یا جدید)..."
                placeholderTextColor="#94a3b8"
                value={nameInput}
                onChangeText={(text) => {
                  setNameInput(text);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />

              {/* دراپ‌داون */}
              {showDropdown &&
                nameInput.length > 0 &&
                filteredMembers.length > 0 && (
                  <View className="absolute top-[50px] left-0 right-0 bg-surface-card border border-surface-muted rounded-xl shadow-lg max-h-40 z-50 overflow-hidden">
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredMembers.map((item) => (
                        <Pressable
                          key={item.id}
                          className="p-3 border-b border-surface-muted/50 active:bg-surface-muted"
                          onPress={() => handleSelectMember(item)}
                        >
                          <Text className="text-text-primary text-right font-main">
                            {item.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
            </View>
          </View>

          {/* دکمه ثبت */}
          <Pressable
            disabled={isLoading}
            onPress={handleSubmit}
            className={`bg-status-success-main mt-5 py-3.5 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform ${isLoading ? 'opacity-70' : 'opacity-100'}`}
          >
            <Text className="text-white font-bold font-main text-sm">
              ثبت و انتقال به لیست نهایی
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}
