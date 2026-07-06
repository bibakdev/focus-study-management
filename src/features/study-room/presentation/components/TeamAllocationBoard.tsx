import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

// 🔴 اطلاعات اختصاصی ربات و چت‌ آیدی
const TELEGRAM_BOT_TOKEN = '7770369278:AAFscQ98y0cd6NEepyfrKzQOIC7jya5POC0';
const TELEGRAM_CHAT_ID = '8586178318';

function parseTelegramLink(
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
    return { chatId: `-100${privateMatch[1]}`, topicId: privateMatch[2] };
  }
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

interface TeamMember {
  id: string;
  name: string;
  target: string;
  teamIndex: number;
}

interface TeamAllocationBoardProps {
  teamNames: string[];
  onFinalStart: () => void;
  initialTopicLink?: string;
  onTopicLinkSave?: (link: string) => void;
}

const getTeamStyles = (index: number) => {
  const colors = [
    {
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-100',
      text: 'text-indigo-800',
      badgeBg: 'bg-white',
      badgeText: 'text-indigo-600',
      cardBorder: 'border-indigo-50',
      btnBg: 'bg-indigo-50',
      btnBorder: 'border-indigo-200',
      btnText: 'text-indigo-700'
    },
    {
      bg: 'bg-fuchsia-50/50',
      border: 'border-fuchsia-100',
      text: 'text-fuchsia-800',
      badgeBg: 'bg-white',
      badgeText: 'text-fuchsia-600',
      cardBorder: 'border-fuchsia-50',
      btnBg: 'bg-fuchsia-50',
      btnBorder: 'border-fuchsia-200',
      btnText: 'text-fuchsia-700'
    },
    {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      text: 'text-emerald-800',
      badgeBg: 'bg-white',
      badgeText: 'text-emerald-600',
      cardBorder: 'border-emerald-50',
      btnBg: 'bg-emerald-50',
      btnBorder: 'border-emerald-200',
      btnText: 'text-emerald-700'
    },
    {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100',
      text: 'text-rose-800',
      badgeBg: 'bg-white',
      badgeText: 'text-rose-600',
      cardBorder: 'border-rose-50',
      btnBg: 'bg-rose-50',
      btnBorder: 'border-rose-200',
      btnText: 'text-rose-700'
    }
  ];
  return colors[index % colors.length];
};

function MemberCard({ member, teamNames, teamStyle, onMove, onRemove }: any) {
  const buttonRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });

  const handleOpenMenu = () => {
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuCoords({ x: px, y: py + height + 4 });
      setMenuVisible(true);
    });
  };

  const currentTeamName = teamNames[member.teamIndex];

  return (
    <>
      <Animated.View
        layout={Layout.springify().damping(20).stiffness(90)}
        className={`bg-white rounded-2xl p-3 flex-row justify-between items-center border ${teamStyle.cardBorder} shadow-sm shadow-slate-100`}
      >
        <View ref={buttonRef} collapsable={false}>
          <Pressable
            onPress={handleOpenMenu}
            className={`px-4 py-2 rounded-full border ${teamStyle.btnBorder} ${teamStyle.btnBg} active:scale-95 transition-transform`}
          >
            <Text
              className={`font-main font-bold text-[10px] ${teamStyle.btnText}`}
            >
              انتقال به: {currentTeamName}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="items-end justify-center">
            <Text className="text-slate-800 font-bold text-sm font-main mb-1">
              {member.name}
            </Text>
            <Text className="text-slate-400 text-[10px] font-main">
              تارگت: {member.target}
            </Text>
          </View>
          <Pressable
            onPress={() => onRemove(member.id)}
            className="active:opacity-60 p-1"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </Animated.View>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: menuCoords.y,
              left: menuCoords.x,
              width: 140
            }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          >
            {teamNames.map((name: string, idx: number) => {
              const isCurrent = idx === member.teamIndex;
              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    onMove(member.id, idx);
                    setMenuVisible(false);
                  }}
                  className={`px-3 py-3 border-b border-slate-100 ${isCurrent ? 'bg-[#3b82f6]' : 'bg-white active:bg-slate-50'}`}
                >
                  <Text
                    className={`font-main text-[11px] text-left ${isCurrent ? 'text-white font-bold' : 'text-slate-700'}`}
                  >
                    انتقال به: {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function TeamAllocationBoard({
  teamNames,
  onFinalStart,
  initialTopicLink,
  onTopicLinkSave
}: TeamAllocationBoardProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'علی', target: '5 ساعت', teamIndex: 0 },
    { id: '2', name: 'محمد', target: '4 ساعت', teamIndex: 1 },
    { id: '3', name: 'مریم', target: '7 ساعت', teamIndex: 1 },
    { id: '4', name: 'سارا', target: '6 ساعت', teamIndex: 2 }
  ]);

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

  const moveMember = (id: string, newTeamIndex: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, teamIndex: newTeamIndex } : m))
    );
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // 🔴 تابع جدید برای ایجاد بسته‌ها با شرط جداسازی تیم‌ها
  const createChunks = (maxLength: number): string[] => {
    const newChunks: string[] = [];
    const mainHeader = '⚔️ تیم‌بندی چالش گروهی\n➖➖➖➖➖➖➖➖\n';
    let currentChunk = mainHeader;

    teamNames.forEach((teamName, index) => {
      const teamMembers = members.filter((m) => m.teamIndex === index);
      if (teamMembers.length === 0) return;

      // اگر وارد یک تیم جدید شدیم و بسته فعلی خالی نیست (دیتا از تیم قبلی دارد)، بسته رو می‌بندیم
      if (currentChunk !== mainHeader && currentChunk.trim() !== '') {
        newChunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const teamIcon = index === 0 ? '🦅' : index === 1 ? '🐯' : '🔰';
      const teamHeader = `${teamIcon} ${teamName} (${teamMembers.length} عضو):\n`;

      if (
        (currentChunk + teamHeader).length > maxLength &&
        currentChunk.trim() !== ''
      ) {
        newChunks.push(currentChunk.trim());
        currentChunk = teamHeader;
      } else {
        currentChunk += teamHeader;
      }

      teamMembers.forEach((m, mIndex) => {
        const line = `  ${mIndex + 1}. ${m.name} - تارگت: ${m.target}\n`;
        if (
          (currentChunk + line).length > maxLength &&
          currentChunk.trim() !== ''
        ) {
          newChunks.push(currentChunk.trim());
          // اگر اعضای تیم سرریز شد، در بسته جدید هدر تیم رو با عنوان (ادامه) می‌نویسیم
          currentChunk = `${teamIcon} ${teamName} (ادامه):\n` + line;
        } else {
          currentChunk += line;
        }
      });
    });

    if (currentChunk.trim() !== '') {
      newChunks.push(currentChunk.trim());
    }

    return newChunks;
  };

  const handleTelegramButtonPress = () => {
    if (members.length === 0) {
      Alert.alert('لیست خالی', 'داده‌ای برای ارسال وجود ندارد.');
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
    if (members.length === 0) {
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
        Alert.alert('خطا در ارتباط', 'مشکلی در ارتباط با سرور تلگرام پیش آمد.');
        break;
      }
    }

    if (!hasError) {
      const destText = topicId ? 'گروه/تاپیک مشخص شده' : 'پی‌وی شما';
      Alert.alert(
        'ارسال موفق',
        `لیست تیم‌ها در قالب ${chunkList.length} بسته به ${destText} ارسال شد.`
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
      setDestination('PV');
      setTopicLink('');
    }, 300);
  };

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} className="w-full mt-2">
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
              کپی تیم‌ها
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-slate-800 font-bold text-base font-main">
            تخصیص تیم‌ها
          </Text>
          <Text className="text-lg">👥</Text>
        </View>
      </View>

      {/* رندر کردن باکس تیم‌ها */}
      {teamNames.map((teamName, index) => {
        const teamMembers = members.filter((m) => m.teamIndex === index);
        const styles = getTeamStyles(index);

        return (
          <View
            key={index}
            className={`${styles.bg} ${styles.border} border rounded-[20px] p-3 mb-4`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View
                className={`${styles.badgeBg} px-3 py-1.5 rounded-lg border ${styles.cardBorder}`}
              >
                <Text
                  className={`${styles.badgeText} text-[11px] font-bold font-main`}
                >
                  {teamMembers.length} عضو
                </Text>
              </View>
              <Text className={`${styles.text} font-bold text-sm font-main`}>
                {teamName}
              </Text>
            </View>

            <View className="gap-2">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    teamNames={teamNames}
                    teamStyle={styles}
                    onMove={moveMember}
                    onRemove={removeMember}
                  />
                ))
              ) : (
                <View className="bg-white/60 rounded-2xl py-6 items-center border border-white">
                  <Text className="text-slate-400 font-main text-[11px] font-bold">
                    تیم خالی است
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <Pressable
        onPress={onFinalStart}
        className="w-full bg-[#10b981] py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform mt-2 mb-8 shadow-md shadow-emerald-200"
      >
        <Text className="text-white font-bold font-main text-sm">
          شروع قطعی چالش 🚀
        </Text>
      </Pressable>

      <BottomSheetModal
        visible={isModalVisible}
        onClose={handleModalClose}
        title={
          modalStep === 'size'
            ? actionType === 'COPY'
              ? `کپی تخصیص تیم‌ها`
              : `ارسال تخصیص تیم‌ها`
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
    </Animated.View>
  );
}
