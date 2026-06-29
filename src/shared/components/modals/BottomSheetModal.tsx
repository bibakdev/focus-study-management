import React from 'react';
import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  description,
  children
}: BottomSheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        {/* پس‌زمینه تیره و تاریک (Backdrop) */}
        <Pressable
          className="absolute inset-0 bg-slate-900/60"
          onPress={onClose}
        />

        {/* بدنه اصلی Sheet */}
        <View className="bg-white rounded-t-3xl px-5 pb-8 pt-4 w-full shadow-2xl max-w-md mx-auto">
          {/* Drag Handle (راهنمای کشیدن) */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </View>

          {/* هدر مدال */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-slate-800 text-right font-[Vazirmatn]">
              {title}
            </Text>
            {description && (
              <Text className="text-sm text-slate-500 text-right mt-1 font-[Vazirmatn]">
                {description}
              </Text>
            )}
          </View>

          {/* محتوای فرم (بسته شدن کیبورد با لمس بیرون فیلد) */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>{children}</View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
