import { ScrollView, View } from 'react-native';
import { BananaChallengeSettings } from '../../components/BananaChallengeSettings';
import { DateSelector } from '../../components/DateSelector';
import { RankingItem, RankingSection } from '../../components/RankingSection';

interface BananaTabPresentationalProps {
  bananaHours: number;
  maxEggplants: number;
  onUpdateSettings: (hours: number, eggplants: number) => void;
  selectedDate: string | null;
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
  bananaResults: RankingItem[];
  streakResults: RankingItem[];
  topicLink?: string;
  onTopicLinkSave: (link: string) => void;
}

export function BananaTabPresentational({
  bananaHours,
  maxEggplants,
  onUpdateSettings,
  selectedDate,
  onConfirmDate,
  onEditDate,
  bananaResults,
  streakResults,
  topicLink,
  onTopicLinkSave
}: BananaTabPresentationalProps) {
  return (
    <View className="flex-1 w-full pt-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ۱. تنظیمات چالش */}
        <BananaChallengeSettings
          initialBananaHours={bananaHours}
          initialMaxEggplants={maxEggplants}
          onSave={onUpdateSettings}
        />

        {/* ۲. بخش تاریخ */}
        <View className="mt-4">
          <DateSelector
            selectedDate={selectedDate}
            onConfirm={onConfirmDate}
            onEdit={onEditDate}
            buttonLabel="دیدن نتایج چالش موز"
          />
        </View>

        {/* ۳. نتایج چالش و استمرارها */}
        {selectedDate && (
          <View className="mt-6">
            <RankingSection
              title="نتایج چالش موزی"
              copyTitle="🍌 Banana Challenge Results"
              emoji="🍌"
              theme="blue"
              data={bananaResults}
              displayType="number"
              valueSuffix="موز"
              initialTopicLink={topicLink}
              onTopicLinkSave={onTopicLinkSave}
            />

            <RankingSection
              title="استمرارها"
              copyTitle="🔥 Active Streaks"
              emoji="🔥"
              theme="orange"
              data={streakResults}
              displayType="number"
              valueSuffix="روز"
              initialTopicLink={topicLink}
              onTopicLinkSave={onTopicLinkSave}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
