import { ScrollView, View } from 'react-native';
import { Member } from '../../../domain/entities/member';
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
  isLoggingTime: boolean;

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
  isLoggingTime,
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
            {/* ثبت دستی از شرط خارج شد تا همیشه زیر تاریخ قابل دسترس باشد */}
            <ManualTimeEntry
              members={members}
              onSubmit={onSubmitLog}
              isLoading={isLoggingTime}
            />

            {/* باکس وارد کردن JSON فقط زمانی که دیتایی استخراج نشده نمایش داده می‌شود */}
            {!hasExtractedData && (
              <JsonExtractionEntry
                onExtract={onExtractJson}
                isLoading={isLoggingTime}
              />
            )}

            {/* لیست کاربران استخراج شده از JSON */}
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

            {/* لیست نهایی (همیشه نمایش داده می‌شود) */}
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
