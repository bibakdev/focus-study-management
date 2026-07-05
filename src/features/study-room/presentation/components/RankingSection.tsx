import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { formatTime, useRankingActions } from '../hooks/use-ranking-actions';
import { RankingActionModal } from './RankingActionModal';

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

  const {
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
  } = useRankingActions(
    title,
    emoji,
    data,
    copyTitle,
    initialTopicLink,
    onTopicLinkSave
  );

  const isBlue = theme === 'blue';
  const containerBg = isBlue ? 'bg-indigo-50/50' : 'bg-orange-50/50';
  const borderColor = isBlue ? 'border-indigo-100' : 'border-orange-100';
  const buttonBg = isBlue ? 'bg-indigo-100' : 'bg-orange-100';
  const buttonText = isBlue ? 'text-indigo-600' : 'text-orange-600';

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

      <RankingActionModal
        title={title}
        visible={isModalVisible}
        actionType={actionType}
        modalStep={modalStep}
        chunks={chunks}
        copiedChunks={copiedChunks}
        initialTopicLink={initialTopicLink}
        onClose={handleModalClose}
        onBack={() => setModalStep('size')}
        onSizeSelect={handleSizeSelection}
        onCopyChunk={copySpecificChunk}
      />
    </>
  );
}
