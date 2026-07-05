import { ScrollView, View } from 'react-native';
import { BananaChallengeSettings } from '../../components/BananaChallengeSettings';
import { DateSelector } from '../../components/DateSelector';
import { RankingItem, RankingSection } from '../../components/RankingSection';

interface BananaTabPresentationalProps {
  bananaThreshold: number;
  maxEggplants: number;
  onUpdateSettings: (thresholdMinutes: number, eggplants: number) => void;
  selectedDate: string | null;
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
  bananaResults: RankingItem[];
  streakResults: RankingItem[];
  topicLink?: string;
  onTopicLinkSave: (link: string) => void;
}

export function BananaTabPresentational({
  bananaThreshold,
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
        <BananaChallengeSettings
          initialBananaThreshold={bananaThreshold}
          initialMaxEggplants={maxEggplants}
          onSave={onUpdateSettings}
        />

        <View className="mt-4">
          <DateSelector
            selectedDate={selectedDate}
            onConfirm={onConfirmDate}
            onEdit={onEditDate}
            buttonLabel="دیدن نتایج چالش موز"
          />
        </View>

        {selectedDate && (
          <View className="mt-6">
            <RankingSection
              title="نتایج چالش موزی"
              copyTitle="🍌 Banana Challenge Results"
              emoji="🍌"
              theme="blue"
              data={bananaResults}
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
              initialTopicLink={topicLink}
              onTopicLinkSave={onTopicLinkSave}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
