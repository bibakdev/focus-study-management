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

// 🔴 اطلاعات اختصاصی ربات و چت‌ آیدی خود را در این قسمت وارد کنید
const TELEGRAM_BOT_TOKEN = '7770369278:AAFscQ98y0cd6NEepyfrKzQOIC7jya5POC0';
const TELEGRAM_CHAT_ID = '8586178318';

export interface RankingItem {
  id: string;
  name: string;
  timeMinutes: number;
  oldRecordMinutes?: number;
}

interface RankingSectionProps {
  title: string;
  copyTitle?: string;
  emoji: string;
  theme: 'blue' | 'orange';
  data: RankingItem[];
  onFilterPress?: () => void;
  filterActive?: boolean;
  initialTopicLink?: string;
  onTopicLinkSave?: (link: string) => void;
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h 0m`;
  return `${m}m`;
};

// تابع استخراج خودکار Chat ID و Topic ID از لینک تلگرام (پشتیبانی از لینک‌های گروه و تاپیک)
function parseTelegramLink(
  link: string
): { chatId: string; topicId?: string } | null {
  // 1. حالت اول: لینک ۳ بخشی مربوط به یک پیام داخل تاپیک (t.me/c/chatId/topicId/msgId)
  const privateTopicMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)\/(\d+)/);
  if (privateTopicMatch) {
    return {
      chatId: `-100${privateTopicMatch[1]}`,
      topicId: privateTopicMatch[2]
    };
  }

  // 2. حالت دوم: لینک ۲ بخشی مربوط به پیام گروه معمولی یا لینک خود تاپیک
  const privateMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (privateMatch) {
    return {
      chatId: `-100${privateMatch[1]}`,
      topicId: privateMatch[2]
    };
  }

  // 3. حالت سوم: لینک ۳ بخشی گروه‌های پابلیک
  const publicTopicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)\/(\d+)/);
  if (publicTopicMatch && publicTopicMatch[1].toLowerCase() !== 'c') {
    return {
      chatId: `@${publicTopicMatch[1]}`,
      topicId: publicTopicMatch[2]
    };
  }

  // 4. حالت چهارم: لینک ۲ بخشی گروه‌های پابلیک
  const publicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  if (publicMatch && publicMatch[1].toLowerCase() !== 'c') {
    return {
      chatId: `@${publicMatch[1]}`,
      topicId: publicMatch[2]
    };
  }

  return null;
}

export function RankingSection({
  title,
  copyTitle,
  emoji,
  theme,
  data,
  onFilterPress,
  filterActive,
  initialTopicLink,
  onTopicLinkSave
}: RankingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const isBlue = theme === 'blue';
  const containerBg = isBlue ? 'bg-indigo-50/50' : 'bg-orange-50/50';
  const borderColor = isBlue ? 'border-indigo-100' : 'border-orange-100';
  const buttonBg = isBlue ? 'bg-indigo-100' : 'bg-orange-100';
  const buttonText = isBlue ? 'text-indigo-600' : 'text-orange-600';

  const generateTextLines = () => {
    const headerTitle = copyTitle || `${emoji} ${title}`;
    let lines = [headerTitle, '➖️➖️➖️➖️➖️➖️➖️➖️'];

    data.forEach((item, index) => {
      const rank = index + 1;
      const timeStr = formatTime(item.timeMinutes);

      let prefix = '';
      if (rank === 1) prefix = '🥇';
      else if (rank === 2) prefix = '🥈';
      else if (rank === 3) prefix = '🥉';
      else prefix = ` ${rank}. `;

      if (item.oldRecordMinutes) {
        lines.push(
          `${prefix}${item.name} - ${formatTime(item.oldRecordMinutes)} 👉 ${timeStr}`
        );
      } else {
        lines.push(`${prefix}${item.name} - ${timeStr}`);
      }

      if (index < data.length - 1) {
        lines.push('');
      }
    });

    return lines;
  };

  const handleTelegramButtonPress = () => {
    if (data.length === 0) {
      Alert.alert('لیست خالی', 'داده‌ای برای ارسال وجود ندارد.');
      return;
    }
    if (
      TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' ||
      TELEGRAM_CHAT_ID === 'YOUR_USER_ID_HERE'
    ) {
      Alert.alert(
        'تنظیمات ناقص',
        'لطفاً ابتدا توکن ربات و چت‌ آی‌دی خود را در بالای فایل کد وارد کنید.'
      );
      return;
    }
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
    if (data.length === 0) {
      Alert.alert('لیست خالی', 'داده‌ای برای کپی وجود ندارد.');
      return;
    }
    setActionType('COPY');
    setModalStep('size');
    setIsModalVisible(true);
  };

  const createChunks = (maxLength: number): string[] => {
    const lines = generateTextLines();
    const newChunks: string[] = [];
    let currentChunk = '';

    lines.forEach((line) => {
      if ((currentChunk + line + '\n').length > maxLength) {
        if (currentChunk) newChunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    });
    if (currentChunk) newChunks.push(currentChunk.trim());

    return newChunks;
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

        // ذخیره‌سازی لینک معتبر برای استفاده‌های بعدی
        if (onTopicLinkSave && topicLink !== initialTopicLink) {
          onTopicLinkSave(topicLink);
        }
      }

      setIsModalVisible(false);
      setIsSending(true);
      await sendChunksToTelegram(newChunks, targetChatId, targetTopicId);
      setIsSending(false);
    }
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
        const bodyData: any = {
          chat_id: chatId,
          text: chunkList[i]
        };

        if (currentTopicId) {
          bodyData.message_thread_id = currentTopicId;
        }

        let response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();

          // در صورتی که لینک فاقد تاپیک بود (اما ما اشتباهاً آن را تاپیک فرض کردیم)
          if (
            errorData.description?.includes('message thread not found') &&
            currentTopicId
          ) {
            delete bodyData.message_thread_id;
            currentTopicId = undefined; // برای پارت‌های بعدی هم تاپیک را حذف می‌کنیم

            // تلاش مجدد برای ارسال پیام در چت عمومی (بدون تاپیک)
            response = await fetch(
              `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
              }
            );

            if (!response.ok) {
              const retryErrorData = await response.json();
              console.error(
                'Telegram API Error on retry',
                i + 1,
                retryErrorData
              );
              Alert.alert(
                'خطا در ارسال',
                `ارسال کامل نشد.\n${retryErrorData.description || ''}`
              );
              hasError = true;
              break;
            }
          } else {
            console.error('Telegram API Error on chunk', i + 1, errorData);
            Alert.alert(
              'خطا در ارسال',
              `ارسال کامل نشد. مطمئن شوید ربات در گروه مدیر است.\n${errorData.description || ''}`
            );
            hasError = true;
            break;
          }
        }

        if (i < chunkList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        hasError = true;
        console.error('Network Error:', error);
        Alert.alert('خطا در ارتباط', 'مشکلی در ارتباط با سرور تلگرام پیش آمد.');
        break;
      }
    }

    if (!hasError) {
      const destText = topicId ? 'گروه/تاپیک مشخص شده' : 'پی‌وی شما';
      Alert.alert(
        'ارسال موفق',
        `لیست شما در قالب ${chunkList.length} بسته با موفقیت به ${destText} ارسال شد.`
      );
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
    <>
      <Animated.View
        layout={Layout.springify().damping(22).stiffness(90)}
        className={`rounded-3xl border mb-4 overflow-hidden ${containerBg} ${borderColor}`}
      >
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-2">
            {onFilterPress && (
              <Pressable
                onPress={onFilterPress}
                disabled={isSending}
                className={`w-9 h-9 rounded-xl items-center justify-center active:scale-95 transition-transform relative ${filterActive ? 'bg-indigo-600' : buttonBg}`}
              >
                <Ionicons
                  name="filter"
                  size={16}
                  color={
                    filterActive ? 'white' : isBlue ? '#4f46e5' : '#ea580c'
                  }
                />
                {filterActive && (
                  <View className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </Pressable>
            )}

            <Pressable
              onPress={handleTelegramButtonPress}
              disabled={isSending}
              className={`w-9 h-9 rounded-xl items-center justify-center active:scale-95 transition-transform ${buttonBg} ${isSending ? 'opacity-50' : ''}`}
            >
              {isSending ? (
                <ActivityIndicator
                  size="small"
                  color={isBlue ? '#4f46e5' : '#ea580c'}
                />
              ) : (
                <Ionicons
                  name="paper-plane-outline"
                  size={16}
                  color={isBlue ? '#4f46e5' : '#ea580c'}
                />
              )}
            </Pressable>

            <Pressable
              onPress={handleCopyButtonPress}
              disabled={isSending}
              className={`px-4 py-2 rounded-xl active:scale-95 transition-transform ${buttonBg}`}
            >
              <Text className={`font-bold font-main text-xs ${buttonText}`}>
                {isBlue ? 'کپی لیست' : 'کپی رکوردها'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex-row justify-end items-center gap-2 py-2 pl-4 active:opacity-70"
          >
            <Text className="text-slate-800 font-bold text-base font-main">
              {title}
            </Text>
            <Text className="text-lg">{emoji}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748b"
            />
          </Pressable>
        </View>

        {isExpanded && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(250)}
            className="px-4 pb-4"
          >
            {data.length === 0 ? (
              <Text className="text-center text-slate-500 font-main py-4">
                {'لیست خالی است'}
              </Text>
            ) : (
              data.map((item, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;

                const cardBg = isFirst
                  ? 'bg-amber-50/30 border-amber-200'
                  : isSecond
                    ? 'bg-slate-50 border-slate-200'
                    : isThird
                      ? 'bg-orange-50/30 border-orange-200'
                      : 'bg-white border-slate-100';
                const rankBg = isFirst
                  ? 'bg-amber-400'
                  : isSecond
                    ? 'bg-slate-300'
                    : isThird
                      ? 'bg-orange-600'
                      : 'bg-slate-50 border border-slate-100';
                const rankTextColor =
                  isFirst || isSecond || isThird
                    ? 'text-white'
                    : 'text-slate-500';
                const medalIcon = isFirst
                  ? '🥇'
                  : isSecond
                    ? '🥈'
                    : isThird
                      ? '🥉'
                      : '▫️';

                return (
                  <View
                    key={item.id}
                    className={`flex-row justify-between items-center p-3 mb-2 rounded-2xl border ${cardBg}`}
                  >
                    <View className="flex-row items-center">
                      {item.oldRecordMinutes ? (
                        <View className="flex-row items-center gap-2">
                          <Text
                            className="text-slate-400 text-xs font-bold line-through"
                            style={{ direction: 'ltr' }}
                          >
                            {formatTime(item.oldRecordMinutes)}
                          </Text>
                          <Text className="text-xs">{'👈'}</Text>
                          <Text
                            className="text-emerald-500 text-sm font-bold"
                            style={{ direction: 'ltr' }}
                          >
                            {formatTime(item.timeMinutes)}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          className="text-slate-600 text-sm font-bold"
                          style={{ direction: 'ltr' }}
                        >
                          {formatTime(item.timeMinutes)}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-slate-800 font-bold text-sm font-main">
                          {item.name}
                        </Text>
                        <Text className="text-sm">{medalIcon}</Text>
                      </View>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center shadow-sm ${rankBg}`}
                      >
                        <Text className={`font-bold text-xs ${rankTextColor}`}>
                          {rank}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
        )}
      </Animated.View>

      <BottomSheetModal
        visible={isModalVisible}
        onClose={handleModalClose}
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
                    <Text className="text-slate-400 text-[10px] font-main mt-2 text-right">
                      لینک یکی از پیام‌های داخل گروه یا تاپیک را پیست کنید.
                    </Text>
                  </Animated.View>
                )}
              </View>
            )}

            <Pressable
              onPress={() => handleSizeSelection(100)}
              className="w-full py-4 rounded-2xl border border-indigo-100 bg-slate-50 items-center justify-center active:bg-indigo-100 transition-colors"
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
            {/* آیتم ثابت برای خط جداکننده */}
            <View className="flex-row items-center justify-between p-4 mb-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(
                    '➖➖➖➖➖➖➖➖\n➖➖➖➖➖➖➖➖'
                  );
                  setCopiedChunks((prev) => new Set(prev).add(-1));
                }}
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
                    onPress={() => copySpecificChunk(chunk, index)}
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
    </>
  );
}
