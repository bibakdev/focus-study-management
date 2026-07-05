import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';

interface BananaChallengeSettingsProps {
  initialBananaHours: number;
  initialMaxEggplants: number;
  onSave: (bananaHours: number, maxEggplants: number) => void;
}

export function BananaChallengeSettings({
  initialBananaHours,
  initialMaxEggplants,
  onSave
}: BananaChallengeSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [bananaHours, setBananaHours] = useState(String(initialBananaHours));
  const [maxEggplants, setMaxEggplants] = useState(String(initialMaxEggplants));

  useEffect(() => {
    setBananaHours(String(initialBananaHours));
    setMaxEggplants(String(initialMaxEggplants));
  }, [initialBananaHours, initialMaxEggplants]);

  const handleSave = () => {
    const hours = parseInt(bananaHours, 10) || 0;
    const eggplants = parseInt(maxEggplants, 10) || 0;

    if (hours <= 0 || eggplants <= 0) {
      Alert.alert('دقت کنید', 'مقادیر تنظیمات نمی‌توانند صفر یا منفی باشند.');
      return;
    }

    onSave(hours, eggplants);
    Keyboard.dismiss();
    Alert.alert('موفق', 'تنظیمات چالش با موفقیت ثبت شد.');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Keyboard.dismiss();
  };

  return (
    <View className="bg-surface-card rounded-[24px] p-4 shadow-sm border border-surface-muted overflow-hidden">
      {/* هدر تنظیمات */}
      <Pressable
        onPress={toggleExpand}
        className={`flex-row justify-between items-center ${isExpanded ? 'pb-3 border-b border-surface-muted/60' : ''} active:opacity-70`}
      >
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#64748b"
        />
        <View className="flex-row items-center gap-2">
          <Text className="text-text-primary font-bold text-base font-main">
            تنظیمات چالش
          </Text>
          <Ionicons name="settings-outline" size={20} color="#64748b" />
        </View>
      </Pressable>

      {/* بدنه تنظیمات بدون انیمیشن */}
      {isExpanded && (
        <View className="pt-3 gap-3">
          {/* ردیف اول: حداقل ساعت دریافت موز */}
          <View className="flex-row justify-between items-center">
            <TextInput
              className="w-16 h-11 border border-surface-muted rounded-xl bg-surface-main text-center text-text-primary font-bold font-main focus:border-primary-main focus:bg-primary-light/10 transition-colors"
              style={
                {
                  outlineStyle: 'none',
                  paddingVertical: 0,
                  lineHeight: 24
                } as any
              }
              keyboardType="numeric"
              maxLength={2}
              value={bananaHours}
              onChangeText={setBananaHours}
            />
            <View className="flex-row items-center gap-2">
              <Text className="text-text-secondary font-bold text-sm font-main">
                حداقل ساعت دریافت موز
              </Text>
              <Text className="text-lg">🍌</Text>
            </View>
          </View>

          {/* ردیف دوم: تعداد بادمجان برای حذف */}
          <View className="flex-row justify-between items-center">
            <TextInput
              className="w-16 h-11 border border-surface-muted rounded-xl bg-surface-main text-center text-text-primary font-bold font-main focus:border-primary-main focus:bg-primary-light/10 transition-colors"
              style={
                {
                  outlineStyle: 'none',
                  paddingVertical: 0,
                  lineHeight: 24
                } as any
              }
              keyboardType="numeric"
              maxLength={2}
              value={maxEggplants}
              onChangeText={setMaxEggplants}
            />
            <View className="flex-row items-center gap-2">
              <Text className="text-text-secondary font-bold text-sm font-main">
                تعداد بادمجان برای حذف
              </Text>
              <Text className="text-lg">🍆</Text>
            </View>
          </View>

          {/* دکمه ثبت تغییرات */}
          <View className="mt-2 pt-3 border-t border-surface-muted/30">
            <Pressable
              onPress={handleSave}
              className="w-full bg-primary-main py-3 rounded-xl items-center active:scale-95 transition-all"
            >
              <Text className="text-white font-bold font-main text-sm">
                ثبت تغییرات
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
