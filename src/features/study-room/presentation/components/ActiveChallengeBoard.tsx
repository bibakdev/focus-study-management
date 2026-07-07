// src/features/study-room/presentation/components/ActiveChallengeBoard.tsx
import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { SecondaryButton } from '@/shared/components/buttons/SecondaryButton';
import { TextInputWithIcon } from '@/shared/components/inputs/TextInputWithIcon';
import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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

export interface CalculatedTeamMember {
  id: string;
  name: string;
  dailyTargetMinutes: number;
  currentMinutes: number;
}

export interface CalculatedTeam {
  name: string;
  totalMinutes: number;
  totalTargetMinutes: number;
  members: CalculatedTeamMember[];
}

interface ActiveChallengeBoardProps {
  teamsData: CalculatedTeam[];
  currentDay: number;
  duration: number;
  onUpdateTeamName: (oldName: string, newName: string) => void;
  onEndChallenge: () => void;
  onCancelChallenge: () => void;
  initialTopicLink?: string;
  onTopicLinkSave?: (link: string) => void;
}

const getTeamStyles = (index: number) => {
  const colors = [
    {
      bg: 'bg-indigo-50/40',
      border: 'border-indigo-100',
      text: 'text-indigo-800',
      badgeBg: 'bg-white',
      badgeText: 'text-indigo-600',
      cardBorder: 'border-indigo-50',
      progressTrack: 'bg-slate-100',
      progressFill: 'bg-indigo-400',
      avatarBg: 'bg-indigo-100',
      avatarText: 'text-indigo-600'
    },
    {
      bg: 'bg-fuchsia-50/40',
      border: 'border-fuchsia-100',
      text: 'text-fuchsia-800',
      badgeBg: 'bg-white',
      badgeText: 'text-fuchsia-600',
      cardBorder: 'border-fuchsia-50',
      progressTrack: 'bg-slate-100',
      progressFill: 'bg-fuchsia-400',
      avatarBg: 'bg-fuchsia-100',
      avatarText: 'text-fuchsia-600'
    },
    {
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-100',
      text: 'text-emerald-800',
      badgeBg: 'bg-white',
      badgeText: 'text-emerald-600',
      cardBorder: 'border-emerald-50',
      progressTrack: 'bg-slate-100',
      progressFill: 'bg-emerald-400',
      avatarBg: 'bg-emerald-100',
      avatarText: 'text-emerald-600'
    },
    {
      bg: 'bg-rose-50/40',
      border: 'border-rose-100',
      text: 'text-rose-800',
      badgeBg: 'bg-white',
      badgeText: 'text-rose-600',
      cardBorder: 'border-rose-50',
      progressTrack: 'bg-slate-100',
      progressFill: 'bg-rose-400',
      avatarBg: 'bg-rose-100',
      avatarText: 'text-rose-600'
    }
  ];
  return colors[index % colors.length];
};

const formatTimeStr = (minutes: number) => {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const formatTimeFa = (minutes: number) => {
  if (minutes === 0) return '0 دقیقه';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
  if (h > 0) return `${h} ساعت`;
  return `${m} دقیقه`;
};

export function ActiveChallengeBoard({
  teamsData,
  currentDay,
  duration,
  onUpdateTeamName,
  onEndChallenge,
  onCancelChallenge,
  initialTopicLink,
  onTopicLinkSave
}: ActiveChallengeBoardProps) {
  const daysArray = Array.from({ length: duration }, (_, i) => i + 1);

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

  const [isEditTeamModalVisible, setIsEditTeamModalVisible] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState('');
  const [editTeamInput, setEditTeamInput] = useState('');

  const handleOpenEditModal = (currentName: string) => {
    setTeamToEdit(currentName);
    setEditTeamInput(currentName);
    setIsEditTeamModalVisible(true);
  };

  const handleSaveTeamEdit = () => {
    if (!editTeamInput.trim()) {
      Alert.alert('دقت کنید', 'نام تیم نمی‌تواند خالی باشد.');
      return;
    }

    if (teamToEdit && editTeamInput.trim() !== teamToEdit) {
      onUpdateTeamName(teamToEdit, editTeamInput.trim());
    }

    setIsEditTeamModalVisible(false);
    Keyboard.dismiss();
  };

  const createChunks = (maxLength: number): string[] => {
    const newChunks: string[] = [];

    const headerChunk = `⚔️ Group Challenge Status (Day ${currentDay} of ${duration})\n➖➖➖➖➖➖➖➖`;
    newChunks.push(headerChunk);

    teamsData.forEach((team, index) => {
      if (team.members.length === 0) return;

      const teamIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

      const isLeader =
        index === 0 &&
        teamsData.length > 1 &&
        team.totalMinutes > teamsData[1].totalMinutes;
      const leaderBadge = isLeader ? ' 👑' : '';

      const targetStr = formatTimeStr(team.totalTargetMinutes * currentDay);
      const teamHeader = `${teamIcon} ${team.name}${leaderBadge} (Total: ${formatTimeStr(team.totalMinutes)} | Target: ${targetStr}):\n`;
      const teamHeaderContinuation = `${teamIcon} ${team.name}:\n`;

      let currentChunk = teamHeader;

      team.members.forEach((m, mIndex) => {
        const studyStr = formatTimeStr(m.currentMinutes);
        const memTargetStr = formatTimeStr(m.dailyTargetMinutes * currentDay);
        const line = `  ${mIndex + 1}. ${m.name} - Study: ${studyStr} | Target: ${memTargetStr}\n`;

        if (
          (currentChunk + line).length > maxLength &&
          currentChunk !== teamHeader &&
          currentChunk !== teamHeaderContinuation
        ) {
          newChunks.push(currentChunk.trimEnd());
          currentChunk = teamHeaderContinuation + line;
        } else {
          currentChunk += line;
        }
      });

      if (currentChunk.trim() !== '') {
        newChunks.push(currentChunk.trimEnd());
      }
    });

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
        `وضعیت تیم‌ها در قالب ${chunkList.length} بسته به ${destText} ارسال شد.`
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
      entering={FadeIn}
      exiting={FadeOut}
      className="w-full mt-2 pb-10"
    >
      <View className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-100 border border-slate-100 mb-4">
        <View className="flex-row justify-between items-center mb-5">
          <View className="bg-indigo-50 px-3 py-1.5 rounded-lg">
            <Text className="text-indigo-600 text-xs font-bold font-main">
              روز {currentDay} از {duration}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-slate-800 font-bold text-base font-main">
              پیشرفت روزهای چالش
            </Text>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#10b981"
            />
          </View>
        </View>

        <View className="flex-row justify-center items-center gap-4 bg-slate-50 py-2.5 rounded-xl mb-5">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-500 text-[10px] font-main">
              باقی‌مانده
            </Text>
            <View className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-600 text-[10px] font-main">
              تا امروز
            </Text>
            <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          </View>
        </View>

        <View
          className="flex-row justify-between items-center"
          style={{ direction: 'rtl' }}
        >
          {daysArray.map((day) => {
            if (day <= currentDay) {
              return (
                <View
                  key={day}
                  className="flex-1 items-center justify-center bg-indigo-600 border border-indigo-600 rounded-xl py-2 mx-1 shadow-md shadow-indigo-200"
                >
                  <Text className="text-white font-bold text-lg font-mono mb-0.5">
                    {day}
                  </Text>
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              );
            } else {
              return (
                <View
                  key={day}
                  className="flex-1 items-center justify-center bg-white border border-dashed border-slate-200 rounded-xl py-2 mx-1 opacity-70"
                >
                  <Text className="text-slate-400 font-bold text-base font-mono mb-0.5">
                    {day}
                  </Text>
                  <Text className="text-slate-300 text-[9px] font-main">
                    خالی
                  </Text>
                </View>
              );
            }
          })}
        </View>
      </View>

      <View className="flex-row items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl py-3.5 mb-4">
        <Text className="text-indigo-700 text-xs font-bold font-main">
          رتبه‌بندی تیم‌ها بر اساس مجموع مطالعه تا امروز
        </Text>
        <Ionicons name="trophy-outline" size={18} color="#4338ca" />
      </View>

      <View className="flex-row items-center justify-between p-4 mb-4 bg-indigo-50/50 border border-indigo-100 rounded-[20px]">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleTelegramButtonPress}
            disabled={isSending}
            className={`w-9 h-9 rounded-xl items-center justify-center active:scale-95 transition-transform bg-indigo-100 ${isSending ? 'opacity-50' : ''}`}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Ionicons name="paper-plane-outline" size={16} color="#4f46e5" />
            )}
          </Pressable>
          <Pressable
            onPress={handleCopyButtonPress}
            disabled={isSending}
            className="px-4 py-2 rounded-xl active:scale-95 transition-transform bg-indigo-100"
          >
            <Text className="font-bold font-main text-xs text-indigo-600">
              کپی وضعیت چالش
            </Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-slate-800 font-bold text-sm font-main">
            ارسال وضعیت
          </Text>
          <Text className="text-lg">📢</Text>
        </View>
      </View>

      {teamsData.map((team, index) => {
        const styles = getTeamStyles(index);
        const isLeader =
          index === 0 &&
          teamsData.length > 1 &&
          team.totalMinutes > teamsData[1].totalMinutes;

        return (
          <View
            key={index}
            className={`${styles.bg} ${styles.border} border rounded-[20px] p-3 mb-5 relative`}
          >
            {isLeader && (
              <View className="absolute -top-3 -right-2 bg-amber-400 px-2 py-0.5 rounded-full border border-white z-10 shadow-sm shadow-amber-200">
                <Text className="text-white text-[10px] font-bold font-main">
                  تیم پیشتاز 👑
                </Text>
              </View>
            )}

            <View className="flex-row justify-between items-center mb-3 px-1 mt-1">
              <View
                className={`${styles.badgeBg} px-3 py-1.5 rounded-lg border ${styles.cardBorder}`}
              >
                <Text
                  className={`${styles.badgeText} text-[11px] font-bold font-main`}
                >
                  مطالعه: {formatTimeFa(team.totalMinutes)} | هدف:{' '}
                  {formatTimeFa(team.totalTargetMinutes * currentDay)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => handleOpenEditModal(team.name)}
                  className="active:opacity-60 p-1 bg-white/50 rounded-lg"
                >
                  <Ionicons name="pencil" size={14} color="#94a3b8" />
                </Pressable>
                <Text className="text-lg">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🔰'}
                </Text>
                <Text
                  className={`${styles.text} font-bold text-base font-main text-right p-0 m-0`}
                >
                  {team.name}
                </Text>
              </View>
            </View>

            <View className="gap-2.5">
              {team.members.map((member, mIndex) => {
                const totalTargetForNow =
                  member.dailyTargetMinutes * currentDay;
                const progressPercent =
                  totalTargetForNow > 0
                    ? Math.min(
                        (member.currentMinutes / totalTargetForNow) * 100,
                        100
                      )
                    : 0;

                return (
                  <View
                    key={member.id}
                    className={`bg-white rounded-2xl p-4 border ${styles.cardBorder} shadow-sm shadow-slate-100`}
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <Text
                        className="text-slate-500 text-[10px] font-bold font-main"
                        style={{ direction: 'rtl' }}
                      >
                        مطالعه: {formatTimeFa(member.currentMinutes)} | هدف:{' '}
                        {formatTimeFa(totalTargetForNow)}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Text className="text-slate-800 font-bold text-sm font-main">
                          {member.name}
                        </Text>
                        <View
                          className={`${styles.avatarBg} w-6 h-6 rounded-full items-center justify-center`}
                        >
                          <Text
                            className={`${styles.avatarText} text-[10px] font-bold font-mono`}
                          >
                            {mIndex + 1}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      className={`w-full h-1.5 rounded-full ${styles.progressTrack} overflow-hidden`}
                    >
                      <View
                        className={`h-full ${styles.progressFill} rounded-full`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={onEndChallenge}
        className="w-full bg-rose-50 border border-rose-200 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform mt-4 shadow-sm"
      >
        <Ionicons name="stop-circle-outline" size={20} color="#e11d48" />
        <Text className="text-rose-600 font-bold font-main text-sm">
          پایان قطعی چالش و اهدای مدال‌ها
        </Text>
      </Pressable>

      {/* 🔴 دکمه جدید برای لغو و حذف کامل چالش */}
      <Pressable
        onPress={onCancelChallenge}
        className="w-full bg-slate-50 border border-slate-200 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform mt-3 shadow-sm"
      >
        <Ionicons name="trash-outline" size={20} color="#64748b" />
        <Text className="text-slate-600 font-bold font-main text-sm">
          حذف چالش (بدون ذخیره نتیجه)
        </Text>
      </Pressable>

      <BottomSheetModal
        visible={isModalVisible}
        onClose={handleModalClose}
        title={
          modalStep === 'size'
            ? actionType === 'COPY'
              ? `کپی وضعیت چالش`
              : `ارسال وضعیت چالش`
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
                    <Text className="text-slate-400 text-[10px] font-main mt-2 text-right">
                      لینک یکی از پیام‌های داخل گروه یا تاپیک را پیست کنید.
                    </Text>
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

      {/* مدال ویرایش نام تیم */}
      <BottomSheetModal
        visible={isEditTeamModalVisible}
        onClose={() => setIsEditTeamModalVisible(false)}
        title="ویرایش نام تیم"
        description="نام جدید تیم را وارد کنید. این نام در جدول و لیست ارسالی تغییر می‌کند."
      >
        <View className="gap-4 mt-2">
          <TextInputWithIcon
            iconName="pencil"
            placeholder="نام تیم..."
            value={editTeamInput}
            onChangeText={setEditTeamInput}
          />

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <SecondaryButton
                label="انصراف"
                onPress={() => setIsEditTeamModalVisible(false)}
              />
            </View>
            <View className="flex-1">
              <PrimaryActionButton
                label="ذخیره نام"
                onPress={handleSaveTeamEdit}
              />
            </View>
          </View>
        </View>
      </BottomSheetModal>
    </Animated.View>
  );
}
