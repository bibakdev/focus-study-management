'use no memo';

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

export interface FinalLog {
  id: string;
  memberId: string;
  memberName: string;
  studyMinutes: number;
}

interface FinalLogsListProps {
  logs: FinalLog[];
  onDeleteLog?: (id: string) => void;
  onUpdateLog?: (
    logId: string,
    memberId: string,
    newName: string,
    newMinutes: number
  ) => void;
}

const formatMinutes = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h 0m`;
  return `${m}m`;
};

function FinalLogCard({
  log,
  onDelete,
  onUpdate
}: {
  log: FinalLog;
  onDelete?: (id: string) => void;
  onUpdate?: (
    logId: string,
    memberId: string,
    newName: string,
    newMinutes: number
  ) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(log.memberName);
  const [editHour, setEditHour] = useState(
    Math.floor(log.studyMinutes / 60).toString()
  );
  const [editMinute, setEditMinute] = useState(
    (log.studyMinutes % 60).toString()
  );

  useEffect(() => {
    setEditName(log.memberName);
    setEditHour(Math.floor(log.studyMinutes / 60).toString());
    setEditMinute((log.studyMinutes % 60).toString());
  }, [log]);

  const handleSave = () => {
    if (!editName.trim()) {
      alert('لطفاً نام را وارد کنید');
      return;
    }
    const h = parseInt(editHour, 10) || 0;
    const m = parseInt(editMinute, 10) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes <= 0) {
      alert('زمان مطالعه نمی‌تواند صفر باشد.');
      return;
    }

    if (totalMinutes > 18 * 60) {
      alert('زمان مطالعه نمی‌تواند بیشتر از ۱۸ ساعت باشد.');
      return;
    }

    if (onUpdate) onUpdate(log.id, log.memberId, editName.trim(), totalMinutes);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setEditName(log.memberName);
    setEditHour(Math.floor(log.studyMinutes / 60).toString());
    setEditMinute((log.studyMinutes % 60).toString());
    setIsEditing(false);
    Keyboard.dismiss();
  };

  return (
    <View
      className="rounded-2xl p-4 mb-3 border"
      style={{
        backgroundColor: isEditing ? '#ffffff' : 'rgba(236, 253, 245, 0.5)',
        borderColor: isEditing ? '#a7f3d0' : '#d1fae5',
        elevation: isEditing ? 1 : 0,
        shadowColor: isEditing ? '#000' : 'transparent',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isEditing ? 0.05 : 0,
        shadowRadius: 2
      }}
    >
      {isEditing ? (
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Pressable
              onPress={handleCancel}
              className="bg-slate-100 px-3 py-1.5 rounded-lg active:bg-slate-200 active:scale-95 transition-all"
            >
              <Text className="text-slate-600 font-main text-xs font-bold">
                انصراف
              </Text>
            </Pressable>
            <View className="bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
              <Text className="text-emerald-600 font-main text-[10px] font-bold">
                ویرایش لاگ
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 mb-4 z-10">
            <View
              className="flex-row items-center justify-center bg-slate-50 border border-slate-200 rounded-xl px-2 h-11 w-[90px]"
              style={{ direction: 'ltr' }}
            >
              <TextInput
                className="w-7 text-slate-800 text-sm font-main font-bold text-center"
                style={{ outlineStyle: 'none' } as any}
                keyboardType="numeric"
                maxLength={2}
                value={editHour}
                onChangeText={setEditHour}
              />
              <Text className="text-slate-400 font-bold pb-1">:</Text>
              <TextInput
                className="w-7 text-slate-800 text-sm font-main font-bold text-center"
                style={{ outlineStyle: 'none' } as any}
                keyboardType="numeric"
                maxLength={2}
                value={editMinute}
                onChangeText={setEditMinute}
              />
            </View>
            <View className="flex-1">
              <TextInput
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 text-sm font-main focus:border-emerald-400"
                style={{ outlineStyle: 'none', textAlign: 'right' } as any}
                value={editName}
                onChangeText={setEditName}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            className="w-full py-3 rounded-xl border border-emerald-200 items-center justify-center active:bg-emerald-50"
          >
            <Text className="text-emerald-600 font-bold font-main text-sm">
              ذخیره در دیتابیس
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-100/50 items-center justify-center">
              <Ionicons name="checkmark" size={18} color="#10b981" />
            </View>
            <Pressable
              onPress={() => setIsEditing(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white items-center justify-center active:bg-slate-50"
            >
              <Ionicons name="pencil-outline" size={16} color="#94a3b8" />
            </Pressable>
            <Pressable
              onPress={() => onDelete && onDelete(log.id)}
              className="w-9 h-9 rounded-xl border border-rose-100 bg-white items-center justify-center active:bg-rose-50"
            >
              <Ionicons name="trash-outline" size={16} color="#f43f5e" />
            </Pressable>
          </View>
          <View className="items-end justify-center">
            <Text className="text-slate-800 font-bold text-base font-[Vazirmatn] mb-1">
              {log.memberName}
            </Text>
            <Text
              className="text-slate-500 text-xs font-[Vazirmatn]"
              style={{ direction: 'rtl' }}
            >
              ثبت شده ·{' '}
              <Text className="font-bold text-slate-700">
                {formatMinutes(log.studyMinutes)}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function FinalLogsList({
  logs,
  onDeleteLog,
  onUpdateLog
}: FinalLogsListProps) {
  if (!logs || logs.length === 0) return null;
  return (
    <View className="mt-8 w-full pb-10">
      <View className="flex-row justify-end items-center mb-4 gap-2">
        <Text className="text-slate-800 font-bold text-lg font-[Vazirmatn]">
          لیست نهایی
        </Text>
        <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
      </View>
      {logs.map((log) => (
        <FinalLogCard
          key={log.id}
          log={log}
          onDelete={onDeleteLog}
          onUpdate={onUpdateLog}
        />
      ))}
    </View>
  );
}
