import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface TeamMember {
  id: string;
  name: string;
  targetHours: number;
  currentMinutes: number;
  teamIndex: number;
}

interface ActiveChallengeBoardProps {
  initialTeamNames: string[];
  duration: number;
  onEndChallenge: () => void; // پراپ جدید
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
    }
  ];
  return colors[index % colors.length];
};

export function ActiveChallengeBoard({
  initialTeamNames,
  duration,
  onEndChallenge
}: ActiveChallengeBoardProps) {
  const [teamNames, setTeamNames] = useState<string[]>(initialTeamNames);

  const [members] = useState<TeamMember[]>([
    { id: '1', name: 'علی', targetHours: 5, currentMinutes: 0, teamIndex: 0 },
    { id: '2', name: 'سارا', targetHours: 6, currentMinutes: 0, teamIndex: 0 },
    { id: '3', name: 'محمد', targetHours: 4, currentMinutes: 0, teamIndex: 1 },
    { id: '4', name: 'مریم', targetHours: 7, currentMinutes: 0, teamIndex: 1 }
  ]);

  const currentDay = 3;
  const daysArray = Array.from({ length: duration }, (_, i) => i + 1);

  const handleTeamNameChange = (text: string, index: number) => {
    setTeamNames((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      className="w-full mt-2 pb-10"
    >
      {/* 1. کارت وضعیت روزهای چالش */}
      <View className="bg-white rounded-3xl p-5 shadow-sm shadow-slate-100 border border-slate-100 mb-4">
        <View className="flex-row justify-between items-center mb-5">
          <View className="bg-indigo-50 px-3 py-1.5 rounded-lg">
            <Text className="text-indigo-600 text-xs font-bold font-main">
              روز {currentDay} از {duration}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-slate-800 font-bold text-base font-main">
              وضعیت روزهای چالش
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
            <Text className="text-slate-600 text-[10px] font-main">امروز</Text>
            <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-600 text-[10px] font-main">
              سپری شده
            </Text>
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </View>
        </View>

        <View
          className="flex-row justify-between items-center"
          style={{ direction: 'rtl' }}
        >
          {daysArray.map((day) => {
            if (day < currentDay) {
              return (
                <View
                  key={day}
                  className="flex-1 items-center justify-center bg-emerald-50 border border-emerald-200 rounded-xl py-2 mx-1"
                >
                  <Text className="text-emerald-600 font-bold text-base font-mono mb-0.5">
                    {day}
                  </Text>
                  <Ionicons name="checkmark" size={14} color="#059669" />
                </View>
              );
            } else if (day === currentDay) {
              return (
                <View
                  key={day}
                  className="flex-1 items-center justify-center bg-indigo-600 border border-indigo-600 rounded-xl py-2 mx-1 shadow-md shadow-indigo-200"
                >
                  <Text className="text-white font-bold text-lg font-mono mb-0.5">
                    {day}
                  </Text>
                  <Text className="text-indigo-100 text-[9px] font-main">
                    امروز
                  </Text>
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

      {/* 2. بنر اطلاع‌رسانی */}
      <View className="flex-row items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl py-3.5 mb-6">
        <Text className="text-indigo-700 text-xs font-bold font-main">
          چالش آغاز شده است! (نمایش آزمایشی)
        </Text>
        <Ionicons name="information-circle-outline" size={18} color="#4338ca" />
      </View>

      {/* 3. لیست تیم‌ها */}
      {teamNames.map((teamName, index) => {
        const teamMembers = members.filter((m) => m.teamIndex === index);
        const styles = getTeamStyles(index);

        return (
          <View
            key={index}
            className={`${styles.bg} ${styles.border} border rounded-[20px] p-3 mb-5`}
          >
            <View className="flex-row justify-between items-center mb-3 px-1">
              <View
                className={`${styles.badgeBg} px-3 py-1.5 rounded-lg border ${styles.cardBorder}`}
              >
                <Text
                  className={`${styles.badgeText} text-[11px] font-bold font-main`}
                >
                  {teamMembers.length} عضو
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">{index === 0 ? '🦅' : '🐯'}</Text>
                <TextInput
                  value={teamName}
                  onChangeText={(text) => handleTeamNameChange(text, index)}
                  className={`${styles.text} font-bold text-base font-main text-right p-0 m-0`}
                  style={{ outlineStyle: 'none' } as any}
                />
              </View>
            </View>

            <View className="gap-2.5">
              {teamMembers.map((member, mIndex) => {
                const currentH = Math.floor(member.currentMinutes / 60);
                const progressPercent = Math.min(
                  (member.currentMinutes / (member.targetHours * 60)) * 100,
                  100
                );

                return (
                  <View
                    key={member.id}
                    className={`bg-white rounded-2xl p-4 border ${styles.cardBorder} shadow-sm shadow-slate-100`}
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-slate-500 font-mono text-[10px] font-bold">
                        {currentH}h / {member.targetHours}h
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

      {/* 4. دکمه خاتمه چالش */}
      <Pressable
        onPress={onEndChallenge}
        className="w-full bg-rose-50 border border-rose-200 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:scale-95 transition-transform mt-4"
      >
        <Ionicons name="stop-circle-outline" size={20} color="#e11d48" />
        <Text className="text-rose-600 font-bold font-main text-sm">
          خاتمه چالش
        </Text>
      </Pressable>
    </Animated.View>
  );
}
