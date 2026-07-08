import { ScrollView, View } from 'react-native';
import { DateSelector } from '../../components/DateSelector';
import { RankingFilterModal } from '../../components/RankingFilterModal';
import { RankingItem, RankingSection } from '../../components/RankingSection';

interface RankingTabPresentationalProps {
  selectedDate: string | null;
  champions: RankingItem[];
  recordBreakers: RankingItem[];
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
  minFilterMinutes: number;
  onSetFilter: (minutes: number) => void;
  isFilterModalOpen: boolean;
  onOpenFilterModal: () => void;
  onCloseFilterModal: () => void;
  topicLink?: string;
  onTopicLinkSave: (link: string) => void;
}

export function RankingTabPresentational({
  selectedDate,
  champions,
  recordBreakers,
  onConfirmDate,
  onEditDate,
  minFilterMinutes,
  onSetFilter,
  isFilterModalOpen,
  onOpenFilterModal,
  onCloseFilterModal,
  topicLink,
  onTopicLinkSave
}: RankingTabPresentationalProps) {
  return (
    <>
      <View className="flex-1 w-full pt-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <DateSelector
            selectedDate={selectedDate}
            onConfirm={onConfirmDate}
            onEdit={onEditDate}
            buttonLabel="مشاهده رتبه‌ها"
          />

          {selectedDate && (
            <View className="mt-6">
              <RankingSection
                title="رتبه‌بندی قهرمانان"
                copyTitle="🏆 Champions Leaderboard"
                emoji="🏆"
                theme="blue"
                data={champions}
                onFilterPress={onOpenFilterModal}
                filterActive={minFilterMinutes > 0}
                initialTopicLink={topicLink}
                onTopicLinkSave={onTopicLinkSave}
                selectedDate={selectedDate}
              />

              <RankingSection
                title="رکورد شکنان"
                copyTitle="🔥 Record Breakers"
                emoji="🔥"
                theme="orange"
                data={recordBreakers}
                initialTopicLink={topicLink}
                onTopicLinkSave={onTopicLinkSave}
                selectedDate={selectedDate}
              />
            </View>
          )}
        </ScrollView>
      </View>

      <RankingFilterModal
        visible={isFilterModalOpen}
        onClose={onCloseFilterModal}
        onSubmit={onSetFilter}
        initialMinutes={minFilterMinutes}
      />
    </>
  );
}
