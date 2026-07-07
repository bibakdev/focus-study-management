// src/features/study-room/presentation/views/group-challenge-tab/GroupChallengeTab.presentational.tsx
import { ScrollView, Text, View } from 'react-native';
import {
  ActiveChallengeBoard,
  CalculatedTeam
} from '../../components/ActiveChallengeBoard';
import {
  ChallengeResultsBoard,
  TopMember
} from '../../components/ChallengeResultsBoard';
import { DateSelector } from '../../components/DateSelector';
import { GroupChallengeSettings } from '../../components/GroupChallengeSettings';
import { TeamAllocationBoard } from '../../components/TeamAllocationBoard';

interface GroupChallengeTabPresentationalProps {
  selectedDate: string | null;
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
  onViewStatus: (settings: any) => void;
  hasStartedChallenge: boolean;
  isChallengeActive: boolean;
  isChallengeFinished: boolean;
  onStartFinalChallenge: (finalMembers: any[]) => void;
  onUpdateTeamName: (oldName: string, newName: string) => void;
  onEndChallenge: () => void;
  onResetChallenge: () => void;
  challengeSettings: any;
  dummyWinnerData: { teamName: string; topMembers: TopMember[] } | null;
  topicLink?: string;
  onTopicLinkSave: (link: string) => void;

  teamsData: CalculatedTeam[];
  currentDay: number;
  duration: number;
}

export function GroupChallengeTabPresentational({
  selectedDate,
  onConfirmDate,
  onEditDate,
  onViewStatus,
  hasStartedChallenge,
  isChallengeActive,
  isChallengeFinished,
  onStartFinalChallenge,
  onUpdateTeamName,
  onEndChallenge,
  onResetChallenge,
  challengeSettings,
  dummyWinnerData,
  topicLink,
  onTopicLinkSave,
  teamsData,
  currentDay,
  duration
}: GroupChallengeTabPresentationalProps) {
  return (
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
          buttonLabel="تایید و ادامه"
        />

        {selectedDate && (
          <View className="mt-6">
            {!isChallengeActive && !isChallengeFinished && (
              <GroupChallengeSettings
                startDate={selectedDate}
                onViewStatus={onViewStatus}
              />
            )}

            {isChallengeFinished && dummyWinnerData ? (
              <ChallengeResultsBoard
                winningTeamName={dummyWinnerData.teamName}
                topMembers={dummyWinnerData.topMembers}
                onReset={onResetChallenge}
                initialTopicLink={topicLink}
                onTopicLinkSave={onTopicLinkSave}
              />
            ) : isChallengeActive ? (
              <ActiveChallengeBoard
                teamsData={teamsData}
                currentDay={currentDay}
                duration={duration}
                onUpdateTeamName={onUpdateTeamName}
                onEndChallenge={onEndChallenge}
                initialTopicLink={topicLink}
                onTopicLinkSave={onTopicLinkSave}
              />
            ) : hasStartedChallenge && challengeSettings ? (
              <TeamAllocationBoard
                teamNames={challengeSettings.teams}
                initialMembers={challengeSettings.allocatedMembers}
                onFinalStart={onStartFinalChallenge}
                initialTopicLink={topicLink}
                onTopicLinkSave={onTopicLinkSave}
              />
            ) : (
              <View className="flex-1 items-center justify-center pt-10 px-6 opacity-60">
                <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                  <Text className="text-3xl">⚔️</Text>
                </View>
                <Text className="text-slate-500 text-sm text-center leading-6 font-main">
                  برای شروع، تنظیمات بالا را تایید و روی مشاهده وضعیت کلیک کنید.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
