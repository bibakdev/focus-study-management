import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export interface TopMember {
  id: string;
  name: string;
  totalMinutes: number;
}

interface ChallengeResultsBoardProps {
  winningTeamName: string;
  topMembers: TopMember[];
  onReset: () => void;
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
  if (h > 0) return `${h} ساعت`;
  return `${m} دقیقه`;
};

export function ChallengeResultsBoard({
  winningTeamName,
  topMembers,
  onReset
}: ChallengeResultsBoardProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      exiting={FadeOut}
      className="w-full mt-2 pb-10"
    >
      {/* کارت اصلی قهرمانی */}
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

        {/* لیست 3 نفر برتر */}
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
                      {formatTime(member.totalMinutes)}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      {/* دکمه شروع چالش جدید */}
      <Pressable
        onPress={onReset}
        className="w-full bg-slate-800 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform shadow-md"
      >
        <Ionicons name="refresh" size={20} color="white" />
        <Text className="text-white font-bold font-main text-sm">
          بستن و شروع چالش جدید
        </Text>
      </Pressable>
    </Animated.View>
  );
}
