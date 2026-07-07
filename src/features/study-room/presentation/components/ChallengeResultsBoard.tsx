// src/features/study-room/presentation/components/ChallengeResultsBoard.tsx
import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

const TELEGRAM_BOT_TOKEN = '7770369278:AAFscQ98y0cd6NEepyfrKzQOIC7jya5POC0';
const TELEGRAM_CHAT_ID = '8586178318';

function parseTelegramLink(
  link: string
): { chatId: string; topicId?: string } | null {
  const privateTopicMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)\/(\d+)/);
  if (privateTopicMatch)
    return {
      chatId: `-100${privateTopicMatch[1]}`,
      topicId: privateTopicMatch[2]
    };

  const privateMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (privateMatch)
    return { chatId: `-100${privateMatch[1]}`, topicId: privateMatch[2] };

  const publicTopicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)\/(\d+)/);
  if (publicTopicMatch && publicTopicMatch[1].toLowerCase() !== 'c') {
    return { chatId: `@${publicTopicMatch[1]}`, topicId: publicTopicMatch[2] };
  }

  const publicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  if (publicMatch && publicMatch[1].toLowerCase() !== 'c') {
    return { chatId: `@${publicMatch[1]}`, topicId: publicMatch[2] };
  }
  return null;
}

export interface TopMember {
  id: string;
  name: string;
  totalMinutes: number;
}

interface ChallengeResultsBoardProps {
  winningTeamName: string;
  topMembers: TopMember[];
  onReset: () => void;
  initialTopicLink?: string;
  onTopicLinkSave?: (link: string) => void;
}

const formatTimeFa = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
  if (h > 0) return `${h} ساعت`;
  return `${m} دقیقه`;
};

const formatTimeEn = (minutes: number) => {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export function ChallengeResultsBoard({
  winningTeamName,
  topMembers,
  onReset,
  initialTopicLink,
  onTopicLinkSave
}: ChallengeResultsBoardProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionType, setActionType] = useState<'COPY' | 'TELEGRAM' | null>(
    null
  );
  const [destination, setDestination] = useState<'PV' | 'TOPIC'>('PV');
  const [topicLink, setTopicLink] = useState('');
  const [modalStep, setModalStep] = useState<'size' | 'chunks'>('size');
  const [chunks, setChunks] = useState<string[]>([]);
  const [copiedChunks, setCopiedChunks] = useState<Set<number>>(new Set());

  const createChunks = (maxLength: number): string[] => {
    const newChunks: string[] = [];
    let currentChunk = `🏆 CHALLENGE COMPLETED! 🏆\n➖➖➖➖➖➖➖➖\n`;

    currentChunk += `🥳 Huge congratulations to team **${winningTeamName}** for their outstanding performance and ultimate victory! 🎉\n\n`;
    currentChunk += `🌟 Top Performers 🌟\n`;

    topMembers.forEach((m, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      currentChunk += `${medal} ${m.name} - ${formatTimeEn(m.totalMinutes)}\n`;
    });

    currentChunk += `\nWell done everyone! Keep up the great work! 💪`;

    if (currentChunk.length <= maxLength) {
      newChunks.push(currentChunk.trim());
    } else {
      let temp = '';
      const lines = currentChunk.split('\n');
      lines.forEach((line) => {
        if ((temp + line + '\n').length > maxLength) {
          newChunks.push(temp.trim());
          temp = line + '\n';
        } else {
          temp += line + '\n';
        }
      });
      if (temp.trim()) newChunks.push(temp.trim());
    }

    return newChunks;
  };

  const handleTelegramButtonPress = () => {
    setActionType('TELEGRAM');
    if (initialTopicLink) {
      setDestination('TOPIC');
      setTopicLink(initialTopicLink);
    } else {
      setDestination('PV');
      setTopicLink('');
    }
    setModalStep('size');
    setIsModalVisible(true);
  };

  const handleCopyButtonPress = () => {
    setActionType('COPY');
    setModalStep('size');
    setIsModalVisible(true);
  };

  const sendChunksToTelegram = async (
    chunkList: string[],
    chatId: string,
    topicId?: string
  ) => {
    let hasError = false;
    let currentTopicId = topicId;

    for (let i = 0; i < chunkList.length; i++) {
      try {
        const bodyData: any = { chat_id: chatId, text: chunkList[i] };
        if (currentTopicId) bodyData.message_thread_id = currentTopicId;

        let response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          if (
            errorData.description?.includes('message thread not found') &&
            currentTopicId
          ) {
            delete bodyData.message_thread_id;
            currentTopicId = undefined;

            response = await fetch(
              `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
              }
            );

            if (!response.ok) {
              const retryErrorData = await response.json();
              Alert.alert(
                'خطا در ارسال',
                `ارسال کامل نشد.\n${retryErrorData.description || ''}`
              );
              hasError = true;
              break;
            }
          } else {
            Alert.alert(
              'خطا در ارسال',
              `ارسال کامل نشد.\n${errorData.description || ''}`
            );
            hasError = true;
            break;
          }
        }
        if (i < chunkList.length - 1)
          await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        hasError = true;
        Alert.alert('خطا در ارتباط', 'مشکلی در ارتباط با سرور تلگرام پیش آمد.');
        break;
      }
    }

    if (!hasError) {
      const destText = topicId ? 'گروه/تاپیک مشخص شده' : 'پی‌وی شما';
      Alert.alert(
        'ارسال موفق',
        `نتایج چالش با موفقیت به ${destText} ارسال شد.`
      );
    }
  };

  const handleSizeSelection = async (maxLength: number) => {
    const newChunks = createChunks(maxLength);
    if (newChunks.length === 0) {
      Alert.alert('لیست خالی', 'داده‌ای برای پردازش وجود ندارد.');
      setIsModalVisible(false);
      return;
    }

    if (actionType === 'COPY') {
      setChunks(newChunks);
      setCopiedChunks(new Set());
      setModalStep('chunks');
    } else if (actionType === 'TELEGRAM') {
      let targetChatId = TELEGRAM_CHAT_ID;
      let targetTopicId: string | undefined = undefined;

      if (destination === 'TOPIC') {
        const parsed = parseTelegramLink(topicLink);
        if (!parsed) {
          Alert.alert(
            'لینک نامعتبر',
            'لطفاً یک لینک معتبر از تلگرام پیست کنید.'
          );
          return;
        }
        targetChatId = parsed.chatId;
        targetTopicId = parsed.topicId;
        if (onTopicLinkSave && topicLink !== initialTopicLink)
          onTopicLinkSave(topicLink);
      }

      setIsModalVisible(false);
      setIsSending(true);
      await sendChunksToTelegram(newChunks, targetChatId, targetTopicId);
      setIsSending(false);
    }
  };

  const copySpecificChunk = async (chunkText: string, index: number) => {
    await Clipboard.setStringAsync(chunkText);
    setCopiedChunks((prev) => new Set(prev).add(index));
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setModalStep('size');
      setChunks([]);
      setCopiedChunks(new Set());
      setActionType(null);
      setDestination('PV');
      setTopicLink('');
    }, 300);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      exiting={FadeOut}
      className="w-full mt-2 pb-10"
    >
      <View className="flex-row items-center justify-between p-4 mb-4 bg-amber-50/50 border border-amber-200 rounded-[20px]">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleTelegramButtonPress}
            disabled={isSending}
            className={`w-9 h-9 rounded-xl items-center justify-center active:scale-95 transition-transform bg-amber-100 ${isSending ? 'opacity-50' : ''}`}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#d97706" />
            ) : (
              <Ionicons name="paper-plane-outline" size={16} color="#d97706" />
            )}
          </Pressable>
          <Pressable
            onPress={handleCopyButtonPress}
            disabled={isSending}
            className="px-4 py-2 rounded-xl active:scale-95 transition-transform bg-amber-100"
          >
            <Text className="font-bold font-main text-xs text-amber-700">
              کپی نتایج
            </Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-amber-900 font-bold text-sm font-main">
            اعلام نتایج به اعضا
          </Text>
          <Text className="text-lg">🎉</Text>
        </View>
      </View>

      <View className="bg-amber-400 rounded-[32px] p-6 shadow-xl shadow-amber-200 border border-amber-300 relative overflow-hidden mb-6">
        <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
        <View className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl" />

        <View className="items-center justify-center z-10 mb-6 mt-4">
          <Text className="text-6xl mb-2">🏆</Text>
          <Text className="text-amber-900 font-bold text-sm font-main mb-1">
            تیم فاتح چالش
          </Text>
          <Text className="text-white font-black text-3xl font-main text-center shadow-sm">
            {winningTeamName}
          </Text>
        </View>

        <View className="bg-white/90 rounded-2xl p-4 z-10">
          <Text className="text-amber-700 font-bold text-xs font-main mb-4 text-center">
            🌟 برترین‌های تیم برنده 🌟
          </Text>

          <View className="gap-3">
            {topMembers.map((member, index) => {
              const isFirst = index === 0;
              const medal = isFirst ? '🥇' : index === 1 ? '🥈' : '🥉';
              const rankBg = isFirst
                ? 'bg-amber-100 border-amber-200'
                : 'bg-slate-50 border-slate-100';

              return (
                <Animated.View
                  key={member.id}
                  layout={Layout.springify()}
                  className={`flex-row items-center justify-between p-3 rounded-xl border ${rankBg}`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{medal}</Text>
                    <Text className="text-slate-800 font-bold text-sm font-main">
                      {member.name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-500 text-[10px] font-main mb-0.5">
                      زمان ثبت شده
                    </Text>
                    <Text
                      className="text-amber-600 font-bold text-xs font-main"
                      style={{ direction: 'rtl' }}
                    >
                      {formatTimeFa(member.totalMinutes)}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      <Pressable
        onPress={onReset}
        className="w-full bg-slate-800 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform shadow-md"
      >
        <Ionicons name="refresh" size={20} color="white" />
        <Text className="text-white font-bold font-main text-sm">
          بستن و شروع چالش جدید
        </Text>
      </Pressable>

      <BottomSheetModal
        visible={isModalVisible}
        onClose={handleModalClose}
        title={
          modalStep === 'size'
            ? actionType === 'COPY'
              ? `کپی نتایج نهایی`
              : `ارسال نتایج نهایی`
            : `آماده کپی (${chunks.length} بسته)`
        }
        description={
          modalStep === 'size'
            ? 'محدودیت تعداد کاراکتر برای شکستن پیام را انتخاب کنید:'
            : undefined
        }
        showCloseButton={true}
        onBack={modalStep === 'chunks' ? () => setModalStep('size') : undefined}
      >
        {modalStep === 'size' ? (
          <View className="gap-3 mt-4">
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
                  </Animated.View>
                )}
              </View>
            )}

            <Pressable
              onPress={() => handleSizeSelection(100)}
              className="w-full py-4 rounded-2xl border border-indigo-100 bg-slate-50 items-center justify-center active:bg-indigo-100 transition-colors mb-3"
            >
              <Text className="text-indigo-700 font-bold font-main text-sm">
                {actionType === 'TELEGRAM'
                  ? 'ارسال در بسته‌های ۱۰۰ کاراکتری'
                  : 'کپی در بسته‌های ۱۰۰ کاراکتری'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSizeSelection(500)}
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
            {chunks.map((chunk, index) => {
              const isCopied = copiedChunks.has(index);
              return (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-indigo-50/50 border border-indigo-100"
                >
                  <Pressable
                    onPress={() => copySpecificChunk(chunk, index)}
                    className={`px-4 py-2 rounded-xl border ${isCopied ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-200'} active:scale-95 transition-all`}
                  >
                    <Text
                      className={`font-bold font-main text-xs ${isCopied ? 'text-white' : 'text-indigo-600'}`}
                    >
                      {isCopied ? 'کپی شد' : 'کپی متن'}
                    </Text>
                  </Pressable>
                  <Text className="text-indigo-900 font-bold font-main text-sm">{`بسته ${index + 1}`}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </BottomSheetModal>
    </Animated.View>
  );
}
