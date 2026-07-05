import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert } from 'react-native';
import { RankingItem } from '../components/RankingSection';

// 🔴 اطلاعات اختصاصی ربات و چت‌ آیدی خود را در این قسمت وارد کنید
const TELEGRAM_BOT_TOKEN = '7770369278:AAFscQ98y0cd6NEepyfrKzQOIC7jya5POC0';
const TELEGRAM_CHAT_ID = '8586178318';

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h 0m`;
  return `${m}m`;
};

// تابع استخراج خودکار Chat ID و Topic ID از لینک تلگرام
export function parseTelegramLink(
  link: string
): { chatId: string; topicId?: string } | null {
  const privateTopicMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)\/(\d+)/);
  if (privateTopicMatch) {
    return {
      chatId: `-100${privateTopicMatch[1]}`,
      topicId: privateTopicMatch[2]
    };
  }

  const privateMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (privateMatch) {
    return {
      chatId: `-100${privateMatch[1]}`,
      topicId: privateMatch[2]
    };
  }

  const publicTopicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)\/(\d+)/);
  if (publicTopicMatch && publicTopicMatch[1].toLowerCase() !== 'c') {
    return {
      chatId: `@${publicTopicMatch[1]}`,
      topicId: publicTopicMatch[2]
    };
  }

  const publicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  if (publicMatch && publicMatch[1].toLowerCase() !== 'c') {
    return {
      chatId: `@${publicMatch[1]}`,
      topicId: publicMatch[2]
    };
  }

  return null;
}

export function useRankingActions(
  title: string,
  emoji: string,
  data: RankingItem[],
  copyTitle?: string,
  initialTopicLink?: string,
  onTopicLinkSave?: (link: string) => void
) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionType, setActionType] = useState<'COPY' | 'TELEGRAM' | null>(
    null
  );
  const [modalStep, setModalStep] = useState<'size' | 'chunks'>('size');
  const [chunks, setChunks] = useState<string[]>([]);
  const [copiedChunks, setCopiedChunks] = useState<Set<number>>(new Set());

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
        'لطفاً ابتدا توکن ربات و چت‌ آی‌دی خود را در فایل هوک وارد کنید.'
      );
      return;
    }
    setActionType('TELEGRAM');
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

          if (
            errorData.description?.includes('message thread not found') &&
            currentTopicId
          ) {
            delete bodyData.message_thread_id;
            currentTopicId = undefined; // پاک کردن تاپیک برای تلاش مجدد

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

  const handleSizeSelection = async (
    maxLength: number,
    destination: 'PV' | 'TOPIC',
    topicLink: string
  ) => {
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
    }, 300);
  };

  return {
    isModalVisible,
    isSending,
    actionType,
    modalStep,
    chunks,
    copiedChunks,
    setModalStep,
    handleTelegramButtonPress,
    handleCopyButtonPress,
    handleSizeSelection,
    copySpecificChunk,
    handleModalClose
  };
}
