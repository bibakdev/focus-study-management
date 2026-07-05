import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert } from 'react-native';
import { RankingItem } from '../components/RankingSection';

// 🔴 اطلاعات اختصاصی ربات و چت‌ آیدی خود را در این قسمت وارد کنید
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = 'YOUR_USER_ID_HERE';

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h 0m`;
  return `${m}m`;
};

export function parseTelegramLink(
  link: string
): { chatId: string; topicId: string } | null {
  const privateMatch = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (privateMatch) {
    return {
      chatId: `-100${privateMatch[1]}`,
      topicId: privateMatch[2]
    };
  }

  const publicMatch = link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  if (publicMatch) {
    if (publicMatch[1].toLowerCase() === 'c') return null;
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
  copyTitle?: string
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
        'لطفاً ابتدا توکن ربات و چت‌ آی‌دی خود را در هوک وارد کنید.'
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

    for (let i = 0; i < chunkList.length; i++) {
      try {
        const bodyData: any = {
          chat_id: chatId,
          text: chunkList[i]
        };

        if (topicId) {
          bodyData.message_thread_id = topicId;
        }

        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
          }
        );

        if (!response.ok) {
          hasError = true;
          const errorData = await response.json();
          console.error('Telegram API Error on chunk', i + 1, errorData);
          break;
        }

        if (i < chunkList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        hasError = true;
        console.error('Network Error:', error);
        break;
      }
    }

    if (hasError) {
      Alert.alert(
        'خطا در ارسال',
        'ارسال کامل نشد. لطفاً وضعیت اینترنت، لینک تاپیک و ربات را بررسی کنید.'
      );
    } else {
      const destText = topicId ? 'تاپیک مشخص شده' : 'پی‌وی شما';
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
            'لطفاً یک لینک معتبر از یک پیام داخل تاپیک تلگرامی پیست کنید.'
          );
          return;
        }
        targetChatId = parsed.chatId;
        targetTopicId = parsed.topicId;
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
