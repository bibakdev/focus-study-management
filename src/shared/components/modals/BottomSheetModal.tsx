import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  onBack?: () => void; // پراپ جدید برای دکمه بازگشت
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  description,
  children,
  showCloseButton,
  onBack
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
          <View className="mb-6 relative min-h-[32px] justify-center">
            {/* دکمه ضربدر در سمت چپ */}
            {showCloseButton && (
              <Pressable
                onPress={onClose}
                className="absolute left-0 top-0 z-10 w-8 h-8 bg-slate-100 rounded-full items-center justify-center active:bg-slate-200 transition-colors"
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </Pressable>
            )}

            {/* عنوان و دکمه بازگشت (در سمت راست) */}
            <View className="flex-row items-center justify-end gap-3">
              <Text className="text-xl font-bold text-slate-800 text-right font-[Vazirmatn]">
                {title}
              </Text>
              {onBack && (
                <Pressable
                  onPress={onBack}
                  className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center active:bg-slate-200 transition-colors"
                >
                  <Ionicons name="chevron-forward" size={18} color="#64748b" />
                </Pressable>
              )}
            </View>

            {description && (
              <Text className="text-sm text-slate-500 text-right mt-2 leading-6 font-[Vazirmatn]">
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
