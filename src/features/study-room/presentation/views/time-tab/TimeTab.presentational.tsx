// src/features/study-room/presentation/views/time-tab/TimeTab.presentational.tsx
import { ScrollView, View } from 'react-native';
import { Member } from '../../../domain/entities/member';
import { AiImageExtraction } from '../../components/AiImageExtraction';
import { DateSelector } from '../../components/DateSelector';
import {
  ConflictGroup,
  ExtractedRecord,
  ExtractedUsersList
} from '../../components/ExtractedUsersList';
import { FinalLog, FinalLogsList } from '../../components/FinalLogsList';
import { JsonExtractionEntry } from '../../components/JsonExtractionEntry';
import { ManualTimeEntry } from '../../components/ManualTimeEntry';

interface TimeTabPresentationalProps {
  selectedDate: string | null;
  members: Member[];
  onConfirmDate: (date: string) => void;
  onEditDate: () => void;
  onSubmitLog: (data: {
    memberId?: string;
    name: string;
    minutes: number;
  }) => void;
  onExtractJson: (jsonString: string) => void;
  onProcessAiImages: (base64Images: string[]) => void; // 🔴 آرایه از تصاویر
  isLoggingTime: boolean;
  isAiLoading: boolean;

  extractedOldUsers: ExtractedRecord[];
  extractedNewUsers: ExtractedRecord[];
  extractedConflicts: ConflictGroup[];

  onApproveExtracted: (
    record: ExtractedRecord,
    type: 'OLD' | 'NEW' | 'CONFLICT'
  ) => void;
  onApproveAllExtracted: (type: 'OLD' | 'NEW') => void;
  onDeleteExtracted: (id: string, type: 'OLD' | 'NEW' | 'CONFLICT') => void;
  onUpdateExtracted: (
    id: string,
    type: 'OLD' | 'NEW' | 'CONFLICT',
    newName: string,
    newMinutes: number
  ) => void;

  finalLogs: FinalLog[];
  onDeleteFinalLog: (id: string) => void;
  onUpdateFinalLog: (
    logId: string,
    memberId: string,
    newName: string,
    newMinutes: number
  ) => void;
}

export function TimeTabPresentational({
  selectedDate,
  members,
  onConfirmDate,
  onEditDate,
  onSubmitLog,
  onExtractJson,
  onProcessAiImages,
  isLoggingTime,
  isAiLoading,
  extractedOldUsers,
  extractedNewUsers,
  extractedConflicts,
  onApproveExtracted,
  onApproveAllExtracted,
  onDeleteExtracted,
  onUpdateExtracted,
  finalLogs,
  onDeleteFinalLog,
  onUpdateFinalLog
}: TimeTabPresentationalProps) {
  const hasExtractedData =
    extractedOldUsers.length > 0 ||
    extractedNewUsers.length > 0 ||
    extractedConflicts.length > 0;

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
        />

        {selectedDate && (
          <View className="mt-2">
            <ManualTimeEntry
              members={members}
              onSubmit={onSubmitLog}
              isLoading={isLoggingTime}
            />

            {!hasExtractedData && (
              <>
                <AiImageExtraction
                  onProcessImages={onProcessAiImages}
                  isLoading={isAiLoading}
                />

                <JsonExtractionEntry
                  onExtract={onExtractJson}
                  isLoading={isLoggingTime}
                />
              </>
            )}

            {hasExtractedData && (
              <ExtractedUsersList
                oldUsers={extractedOldUsers}
                newUsers={extractedNewUsers}
                conflicts={extractedConflicts}
                onApprove={onApproveExtracted}
                onApproveAll={onApproveAllExtracted}
                onDelete={onDeleteExtracted}
                onUpdate={onUpdateExtracted}
              />
            )}

            <FinalLogsList
              logs={finalLogs}
              onDeleteLog={onDeleteFinalLog}
              onUpdateLog={onUpdateFinalLog}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
