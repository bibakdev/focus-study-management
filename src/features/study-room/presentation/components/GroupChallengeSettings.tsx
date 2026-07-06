import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface GroupChallengeSettingsProps {
  startDate: string | null;
  onViewStatus: (settings: any) => void;
}

const PERSIAN_ORDINALS = [
  'اول',
  'دوم',
  'سوم',
  'چهارم',
  'پنجم',
  'ششم',
  'هفتم',
  'هشتم',
  'نهم',
  'دهم'
];

export function GroupChallengeSettings({
  startDate,
  onViewStatus
}: GroupChallengeSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [duration, setDuration] = useState('2');
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[]>(['عقاب‌ها 🦅', 'شیرها 🐯']);

  // مدیریت تغییر تعداد تیم‌ها
  const handleTeamCountChange = (newCount: number) => {
    if (newCount < 2 || newCount > 10) return;
    setTeamCount(newCount);

    setTeams((prevTeams) => {
      const newTeams = [...prevTeams];
      if (newCount > prevTeams.length) {
        // اضافه کردن تیم جدید با نام پیش‌فرض
        for (let i = prevTeams.length; i < newCount; i++) {
          newTeams.push(`تیم ${i + 1}`);
        }
      } else if (newCount < prevTeams.length) {
        // حذف تیم‌های اضافه
        newTeams.splice(newCount);
      }
      return newTeams;
    });
  };

  const handleTeamNameChange = (text: string, index: number) => {
    setTeams((prev) => {
      const newTeams = [...prev];
      newTeams[index] = text;
      return newTeams;
    });
  };

  const handleSubmit = () => {
    onViewStatus({
      startDate,
      duration: parseInt(duration) || 2,
      teamCount,
      teams
    });
  };

  return (
    <View className="bg-slate-50 rounded-[24px] p-5 shadow-sm border border-indigo-50/50 mb-6 relative overflow-hidden">
      {/* بک‌گراند ملایم مشابه تصویر */}
      <View className="absolute inset-0 bg-indigo-50/30 opacity-50" />

      {/* هدر */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className={`flex-row justify-between items-center ${isExpanded ? 'pb-4 border-b border-indigo-100/50 mb-4' : ''} active:opacity-70`}
      >
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#4f46e5"
        />
        <View className="flex-row items-center gap-2">
          <Text className="text-indigo-900 font-bold text-base font-main">
            تنظیمات چالش گروهی
          </Text>
          <Ionicons name="add" size={20} color="#4f46e5" />
        </View>
      </Pressable>

      {/* محتوای باز شونده */}
      {isExpanded && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {/* ردیف اول: تاریخ و مدت چالش */}
          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-slate-600 font-main text-xs mb-2 text-right">
                تاریخ شروع (شمسی):
              </Text>
              <View className="bg-white border border-slate-200 rounded-2xl h-12 justify-center px-3 shadow-sm shadow-slate-100">
                <Text className="text-slate-800 font-main text-center font-bold">
                  {startDate || '----/--/--'}
                </Text>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-slate-600 font-main text-xs mb-2 text-right">
                مدت چالش (روز):
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-2xl h-12 text-center text-slate-800 font-main font-bold shadow-sm shadow-slate-100 focus:border-indigo-400"
                style={{ outlineStyle: 'none' } as any}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>

          {/* ردیف دوم: انتخاب تعداد تیم‌ها */}
          <View className="flex-row items-center justify-between mb-5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => handleTeamCountChange(teamCount - 1)}
                disabled={teamCount <= 2}
                className={`w-8 h-8 rounded-full items-center justify-center ${teamCount <= 2 ? 'bg-slate-100' : 'bg-indigo-100 active:bg-indigo-200'}`}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={teamCount <= 2 ? '#94a3b8' : '#4f46e5'}
                />
              </Pressable>
              <Text className="font-main font-bold text-lg text-slate-800 w-6 text-center">
                {teamCount}
              </Text>
              <Pressable
                onPress={() => handleTeamCountChange(teamCount + 1)}
                disabled={teamCount >= 10}
                className={`w-8 h-8 rounded-full items-center justify-center ${teamCount >= 10 ? 'bg-slate-100' : 'bg-indigo-100 active:bg-indigo-200'}`}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={teamCount >= 10 ? '#94a3b8' : '#4f46e5'}
                />
              </Pressable>
            </View>
            <Text className="text-slate-700 font-bold text-sm font-main">
              تعداد تیم‌های شرکت‌کننده:
            </Text>
          </View>

          {/* ردیف سوم: نام‌گذاری تیم‌ها به صورت داینامیک */}
          <View className="flex-row flex-wrap justify-between gap-y-4 mb-6">
            {teams.map((teamName, index) => (
              <View
                key={index}
                style={{ width: '48%' }} // قرارگیری دو آیتم در هر ردیف
              >
                <Text className="text-slate-600 font-main text-xs mb-2 text-right">
                  نام تیم {PERSIAN_ORDINALS[index] || index + 1}:
                </Text>
                <TextInput
                  className="bg-white border border-indigo-100 rounded-2xl h-12 text-center text-slate-800 font-main font-bold shadow-sm shadow-indigo-50 focus:border-indigo-400"
                  style={{ outlineStyle: 'none' } as any}
                  value={teamName}
                  onChangeText={(text) => handleTeamNameChange(text, index)}
                />
              </View>
            ))}
          </View>

          {/* دکمه اکشن (رنگ بنفش/آبی مشابه تصویر) */}
          <PrimaryActionButton
            label="مشاهده وضعیت"
            onPress={handleSubmit}
            style={{ backgroundColor: '#5651e5' }} // رنگ کاستوم برای تطابق با تصویر
          />
        </Animated.View>
      )}
    </View>
  );
}
