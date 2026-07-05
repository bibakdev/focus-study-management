import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface RankingActionModalProps {
  title: string;
  visible: boolean;
  actionType: 'COPY' | 'TELEGRAM' | null;
  modalStep: 'size' | 'chunks';
  chunks: string[];
  copiedChunks: Set<number>;
  initialTopicLink?: string;
  onClose: () => void;
  onBack: () => void;
  onSizeSelect: (
    maxLength: number,
    destination: 'PV' | 'TOPIC',
    topicLink: string
  ) => void;
  onCopyChunk: (chunk: string, index: number) => void;
}

export function RankingActionModal({
  title,
  visible,
  actionType,
  modalStep,
  chunks,
  copiedChunks,
  initialTopicLink,
  onClose,
  onBack,
  onSizeSelect,
  onCopyChunk
}: RankingActionModalProps) {
  const [destination, setDestination] = useState<'PV' | 'TOPIC'>('PV');
  const [topicLink, setTopicLink] = useState('');

  // پر کردن خودکار تب و لینک در صورت وجود سابقه
  useEffect(() => {
    if (!visible) {
      setDestination('PV');
      setTopicLink('');
    } else {
      if (initialTopicLink) {
        setDestination('TOPIC');
        setTopicLink(initialTopicLink);
      } else {
        setDestination('PV');
        setTopicLink('');
      }
    }
  }, [visible, initialTopicLink]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={
        modalStep === 'size'
          ? actionType === 'COPY'
            ? `کپی ${title}`
            : `ارسال ${title}`
          : `آماده کپی (${chunks.length} بسته)`
      }
      description={
        modalStep === 'size'
          ? 'بر اساس محدودیت گروه خود یکی از گزینه‌های زیر را برای تقسیم‌بندی لیست انتخاب کنید:'
          : undefined
      }
      showCloseButton={true}
      onBack={modalStep === 'chunks' ? onBack : undefined}
    >
      {modalStep === 'size' ? (
        <View className="gap-3 mt-4">
          {/* تنظیمات مسیر ارسال فقط در حالت تلگرام */}
          {actionType === 'TELEGRAM' && (
            <View className="mb-4 bg-white p-3 rounded-2xl border border-indigo-100">
              <Text className="text-right font-bold text-slate-800 font-main mb-3 text-sm">
                تنظیمات مسیر ارسال
              </Text>
              <View className="flex-row gap-2 mb-3">
                <Pressable
                  onPress={() => setDestination('PV')}
                  className={`flex-1 py-2.5 rounded-xl border transition-colors ${destination === 'PV' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-200'}`}
                >
                  <Text
                    className={`text-center font-bold font-main text-xs ${destination === 'PV' ? 'text-indigo-700' : 'text-slate-500'}`}
                  >
                    پی‌وی من
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDestination('TOPIC')}
                  className={`flex-1 py-2.5 rounded-xl border transition-colors ${destination === 'TOPIC' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-200'}`}
                >
                  <Text
                    className={`text-center font-bold font-main text-xs ${destination === 'TOPIC' ? 'text-indigo-700' : 'text-slate-500'}`}
                  >
                    تاپیک گروه
                  </Text>
                </Pressable>
              </View>

              {destination === 'TOPIC' && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                  <TextInput
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-800 text-xs font-main"
                    style={
                      {
                        textAlign: 'left',
                        direction: 'ltr',
                        outlineStyle: 'none'
                      } as any
                    }
                    placeholder="https://t.me/c/12345/55/..."
                    placeholderTextColor="#94a3b8"
                    value={topicLink}
                    onChangeText={setTopicLink}
                  />
                  <Text className="text-slate-400 text-[10px] font-main mt-2 text-right">
                    لینک یکی از پیام‌های داخل تاپیک مد نظر را پیست کنید.
                  </Text>
                </Animated.View>
              )}
            </View>
          )}

          <Pressable
            onPress={() => onSizeSelect(100, destination, topicLink)}
            className="w-full py-4 rounded-2xl border border-indigo-100 bg-slate-50 items-center justify-center active:bg-indigo-100 transition-colors"
          >
            <Text className="text-indigo-700 font-bold font-main text-sm">
              {actionType === 'TELEGRAM'
                ? 'ارسال در بسته‌های ۱۰۰ کاراکتری'
                : 'کپی در بسته‌های ۱۰۰ کاراکتری'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onSizeSelect(500, destination, topicLink)}
            className="w-full py-4 rounded-2xl border border-indigo-100 bg-slate-50 items-center justify-center active:bg-indigo-100 transition-colors"
          >
            <Text className="text-indigo-700 font-bold font-main text-sm">
              {actionType === 'TELEGRAM'
                ? 'ارسال در بسته‌های ۵۰۰ کاراکتری'
                : 'کپی در بسته‌های ۵۰۰ کاراکتری'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="max-h-[400px] mt-2"
          showsVerticalScrollIndicator={false}
        >
          {/* آیتم ثابت برای خط جداکننده */}
          <View className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <Pressable
              onPress={() =>
                onCopyChunk('➖➖➖➖➖➖➖➖\n➖➖➖➖➖➖➖➖', -1)
              }
              className={`px-4 py-2 rounded-xl border ${copiedChunks.has(-1) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-200'} active:scale-95 transition-all`}
            >
              <Text
                className={`font-bold font-main text-xs ${copiedChunks.has(-1) ? 'text-white' : 'text-indigo-600'}`}
              >
                {copiedChunks.has(-1) ? 'کپی شد' : 'کپی متن'}
              </Text>
            </Pressable>
            <Text className="text-indigo-900 font-bold font-main text-sm">
              خط جداکننده
            </Text>
          </View>

          {/* لیست بسته‌های تولید شده */}
          {chunks.map((chunk, index) => {
            const isCopied = copiedChunks.has(index);
            return (
              <View
                key={index}
                className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-indigo-50/50 border border-indigo-100"
              >
                <Pressable
                  onPress={() => onCopyChunk(chunk, index)}
                  className={`px-4 py-2 rounded-xl border ${isCopied ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-200'} active:scale-95 transition-all`}
                >
                  <Text
                    className={`font-bold font-main text-xs ${isCopied ? 'text-white' : 'text-indigo-600'}`}
                  >
                    {isCopied ? 'کپی شد' : 'کپی متن'}
                  </Text>
                </Pressable>
                <Text className="text-indigo-900 font-bold font-main text-sm">
                  {`بسته ${index + 1}`}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}
