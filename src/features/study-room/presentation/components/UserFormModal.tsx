import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { SecondaryButton } from '@/shared/components/buttons/SecondaryButton';
import { TextInputWithIcon } from '@/shared/components/inputs/TextInputWithIcon';
import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Member, MemberTarget } from '../../../domain/entities/member';

export interface TimeInput {
  h: string;
  m: string;
}

export interface UserFormData {
  name: string;
  isActive: boolean;
  inBananaChallenge: boolean;
  activeStreak: number;
  absenceDays: number;
  targetType: 'FIXED' | 'WEEKLY';
  defaultTime: TimeInput;
  weekly: {
    saturday: TimeInput;
    sunday: TimeInput;
    monday: TimeInput;
    tuesday: TimeInput;
    wednesday: TimeInput;
    thursday: TimeInput;
    friday: TimeInput;
  };
}

interface UserFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: { member: Member; target: MemberTarget } | null;
}

const minsToTime = (mins: number): TimeInput => ({
  h: String(Math.floor(mins / 60)),
  m: String(mins % 60).padStart(2, '0')
});

export function UserFormModal({
  visible,
  onClose,
  onSubmit,
  initialData
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    isActive: true,
    inBananaChallenge: true,
    activeStreak: 0,
    absenceDays: 0,
    targetType: 'FIXED',
    defaultTime: { h: '0', m: '00' },
    weekly: {
      saturday: { h: '0', m: '00' },
      sunday: { h: '0', m: '00' },
      monday: { h: '0', m: '00' },
      tuesday: { h: '0', m: '00' },
      wednesday: { h: '0', m: '00' },
      thursday: { h: '0', m: '00' },
      friday: { h: '0', m: '00' }
    }
  });

  useEffect(() => {
    if (initialData && visible) {
      setFormData({
        name: initialData.member.name,
        isActive: initialData.member.isActive,
        inBananaChallenge: initialData.member.inBananaChallenge ?? true,
        activeStreak: initialData.member.activeStreak,
        absenceDays: initialData.member.absenceDays || 0,
        targetType: initialData.target?.targetType || 'FIXED',
        defaultTime: minsToTime(initialData.target?.defaultMinutes || 0),
        weekly: {
          saturday: minsToTime(initialData.target?.saturdayMinutes || 0),
          sunday: minsToTime(initialData.target?.sundayMinutes || 0),
          monday: minsToTime(initialData.target?.mondayMinutes || 0),
          tuesday: minsToTime(initialData.target?.tuesdayMinutes || 0),
          wednesday: minsToTime(initialData.target?.wednesdayMinutes || 0),
          thursday: minsToTime(initialData.target?.thursdayMinutes || 0),
          friday: minsToTime(initialData.target?.fridayMinutes || 0)
        }
      });
    } else if (!visible) {
      setFormData({
        name: '',
        isActive: true,
        inBananaChallenge: true,
        activeStreak: 0,
        absenceDays: 0,
        targetType: 'FIXED',
        defaultTime: { h: '0', m: '00' },
        weekly: {
          saturday: { h: '0', m: '00' },
          sunday: { h: '0', m: '00' },
          monday: { h: '0', m: '00' },
          tuesday: { h: '0', m: '00' },
          wednesday: { h: '0', m: '00' },
          thursday: { h: '0', m: '00' },
          friday: { h: '0', m: '00' }
        }
      });
    }
  }, [initialData, visible]);

  const updateWeekly = (
    day: keyof UserFormData['weekly'],
    field: keyof TimeInput,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: { ...prev.weekly[day], [field]: value }
      }
    }));
  };

  const daysConfig: { key: keyof UserFormData['weekly']; label: string }[] = [
    { key: 'saturday', label: 'شنبه' },
    { key: 'sunday', label: 'یکشنبه' },
    { key: 'monday', label: 'دوشنبه' },
    { key: 'tuesday', label: 'سه‌شنبه' },
    { key: 'wednesday', label: 'چهارشنبه' },
    { key: 'thursday', label: 'پنج‌شنبه' },
    { key: 'friday', label: 'جمعه' }
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
      description="اطلاعات هویتی و تارگت‌های مطالعه را تنظیم کنید."
    >
      <View className="gap-4">
        <TextInputWithIcon
          iconName="person"
          placeholder="نام کاربر"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <View className="flex-row items-center justify-between bg-surface-muted p-3 rounded-2xl">
          <Switch
            value={formData.isActive}
            onValueChange={(val) => setFormData({ ...formData, isActive: val })}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor="#ffffff"
          />
          <View className="flex-row items-center gap-2">
            <Text className="font-main text-text-primary font-bold">
              وضعیت کاربر (فعال)
            </Text>
            <Ionicons
              name="power"
              size={18}
              color={formData.isActive ? '#10b981' : '#94a3b8'}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-surface-muted p-3 rounded-2xl">
          <Switch
            value={formData.inBananaChallenge}
            onValueChange={(val) =>
              setFormData({ ...formData, inBananaChallenge: val })
            }
            trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
            thumbColor="#ffffff"
          />
          <View className="flex-row items-center gap-2">
            <Text className="font-main text-text-primary font-bold">
              شرکت در چالش موزی
            </Text>
            <Text className="text-lg">🍌</Text>
          </View>
        </View>

        <View className="flex-row bg-surface-muted p-3 rounded-2xl items-center justify-between">
          <Text className="font-main text-text-muted text-sm font-bold">
            {formData.isActive ? 'روزهای استمرار 🔥' : 'روزهای غیبت 💤'}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() =>
                setFormData((p) => ({
                  ...p,
                  [formData.isActive ? 'activeStreak' : 'absenceDays']:
                    Math.max(
                      0,
                      p[formData.isActive ? 'activeStreak' : 'absenceDays'] - 1
                    )
                }))
              }
              className="bg-surface-card w-8 h-8 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="remove" size={16} color="#64748b" />
            </Pressable>
            <Text className="font-main font-bold text-lg text-text-primary w-8 text-center">
              {formData.isActive ? formData.activeStreak : formData.absenceDays}
            </Text>
            <Pressable
              onPress={() =>
                setFormData((p) => ({
                  ...p,
                  [formData.isActive ? 'activeStreak' : 'absenceDays']:
                    p[formData.isActive ? 'activeStreak' : 'absenceDays'] + 1
                }))
              }
              className="bg-surface-card w-8 h-8 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="add" size={16} color="#64748b" />
            </Pressable>
          </View>
        </View>

        <View className="bg-surface-muted p-4 rounded-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <Switch
              value={formData.targetType === 'WEEKLY'}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  targetType: val ? 'WEEKLY' : 'FIXED'
                })
              }
              trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
            <Text className="font-main text-text-primary font-bold">
              تارگت متغیر (هفتگی)
            </Text>
          </View>

          {formData.targetType === 'FIXED' ? (
            <View className="flex-row items-center justify-between bg-surface-card p-3 rounded-xl">
              <Text className="font-main text-text-muted text-sm">
                زمان در روز
              </Text>
              <View
                className="flex-row items-center gap-1"
                style={{ direction: 'ltr' }}
              >
                <TextInput
                  className="font-main font-bold text-primary-main text-center w-12 bg-primary-light/30 py-2 rounded-lg"
                  keyboardType="numeric"
                  placeholder="00"
                  maxLength={2}
                  value={formData.defaultTime.h}
                  onChangeText={(val) =>
                    setFormData({
                      ...formData,
                      defaultTime: { ...formData.defaultTime, h: val }
                    })
                  }
                />
                <Text className="font-main font-bold text-primary-main">:</Text>
                <TextInput
                  className="font-main font-bold text-primary-main text-center w-12 bg-primary-light/30 py-2 rounded-lg"
                  keyboardType="numeric"
                  placeholder="00"
                  maxLength={2}
                  value={formData.defaultTime.m}
                  onChangeText={(val) =>
                    setFormData({
                      ...formData,
                      defaultTime: { ...formData.defaultTime, m: val }
                    })
                  }
                />
              </View>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-end gap-2">
              {daysConfig.map((day) => (
                <View
                  key={day.key}
                  className="bg-surface-card p-2 rounded-xl items-center w-[30%]"
                >
                  <Text className="font-main text-text-muted text-xs mb-2">
                    {day.label}
                  </Text>
                  <View
                    className="flex-row items-center justify-center gap-1 w-full"
                    style={{ direction: 'ltr' }}
                  >
                    <TextInput
                      className="font-main font-bold text-primary-main text-center w-8 bg-primary-light/30 py-1.5 rounded-lg text-xs"
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                      value={formData.weekly[day.key].h}
                      onChangeText={(val) => updateWeekly(day.key, 'h', val)}
                    />
                    <Text className="font-main font-bold text-primary-main text-xs">
                      :
                    </Text>
                    <TextInput
                      className="font-main font-bold text-primary-main text-center w-8 bg-primary-light/30 py-1.5 rounded-lg text-xs"
                      keyboardType="numeric"
                      placeholder="00"
                      maxLength={2}
                      value={formData.weekly[day.key].m}
                      onChangeText={(val) => updateWeekly(day.key, 'm', val)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row gap-3 mt-2">
          <View className="flex-1">
            <SecondaryButton label="انصراف" onPress={onClose} />
          </View>
          <View className="flex-1">
            <PrimaryActionButton
              label="ذخیره اطلاعات"
              onPress={() => onSubmit(formData)}
            />
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}
