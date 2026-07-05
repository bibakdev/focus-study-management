import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { SecondaryButton } from '@/shared/components/buttons/SecondaryButton';
import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';

interface RankingFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (minMinutes: number) => void;
  initialMinutes?: number;
}

export function RankingFilterModal({
  visible,
  onClose,
  onSubmit,
  initialMinutes = 0
}: RankingFilterModalProps) {
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  useEffect(() => {
    if (visible) {
      setHourInput(Math.floor(initialMinutes / 60).toString());
      setMinuteInput((initialMinutes % 60).toString());
    } else {
      Keyboard.dismiss();
    }
  }, [visible, initialMinutes]);

  const handleSubmit = () => {
    const h = parseInt(hourInput, 10) || 0;
    const m = parseInt(minuteInput, 10) || 0;
    onSubmit(h * 60 + m);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    onSubmit(0);
    Keyboard.dismiss();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="تنظیمات رتبه‌بندی"
      description="حداقل زمان مطالعه برای نمایش و اشتراک‌گذاری در لیست قهرمانان را تعیین کنید."
    >
      <View className="gap-4 mt-2">
        <View className="flex-row items-center justify-between bg-surface-card p-4 rounded-2xl border border-surface-muted shadow-sm">
          <Text className="font-main text-text-primary font-bold">
            حداقل زمان نمایش
          </Text>
          <View
            className="flex-row items-center gap-1"
            style={{ direction: 'ltr' }}
          >
            <TextInput
              className="font-main font-bold text-primary-main text-center w-14 bg-primary-light/30 py-2.5 rounded-xl text-lg"
              keyboardType="numeric"
              placeholder="0"
              maxLength={2}
              value={hourInput}
              onChangeText={setHourInput}
              style={{ outlineStyle: 'none' } as any}
            />
            <Text className="font-main font-bold text-primary-main text-lg">
              :
            </Text>
            <TextInput
              className="font-main font-bold text-primary-main text-center w-14 bg-primary-light/30 py-2.5 rounded-xl text-lg"
              keyboardType="numeric"
              placeholder="00"
              maxLength={2}
              value={minuteInput}
              onChangeText={setMinuteInput}
              style={{ outlineStyle: 'none' } as any}
            />
          </View>
        </View>

        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <SecondaryButton label="حذف فیلتر" onPress={handleClear} />
          </View>
          <View className="flex-1">
            <PrimaryActionButton label="اعمال فیلتر" onPress={handleSubmit} />
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}
