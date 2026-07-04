import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export interface ExtractedRecord {
  id: string;
  name: string;
  today_time: string;
  minutes: number;
  isFocussing: boolean;
}

export interface ConflictGroup {
  conflict_name: string;
  is_in_database: boolean;
  records: ExtractedRecord[];
}

interface ExtractedUsersListProps {
  oldUsers: ExtractedRecord[];
  newUsers: ExtractedRecord[];
  conflicts: ConflictGroup[];
  onApprove: (
    record: ExtractedRecord,
    type: 'OLD' | 'NEW' | 'CONFLICT'
  ) => void;
  onApproveAll: (type: 'OLD' | 'NEW') => void;
  onDelete: (id: string, type: 'OLD' | 'NEW' | 'CONFLICT') => void;
  onUpdate: (
    id: string,
    type: 'OLD' | 'NEW' | 'CONFLICT',
    newName: string,
    newMinutes: number
  ) => void;
}

function ExtractedUserCard({
  record,
  themeColor,
  themeBg,
  type,
  isConflict = false,
  onApprove,
  onDelete,
  onUpdate
}: {
  record: ExtractedRecord;
  themeColor: string;
  themeBg: string;
  type: 'OLD' | 'NEW' | 'CONFLICT';
  isConflict?: boolean;
  onApprove: (
    record: ExtractedRecord,
    type: 'OLD' | 'NEW' | 'CONFLICT'
  ) => void;
  onDelete: (id: string, type: 'OLD' | 'NEW' | 'CONFLICT') => void;
  onUpdate: (
    id: string,
    type: 'OLD' | 'NEW' | 'CONFLICT',
    newName: string,
    newMinutes: number
  ) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(record.name);
  const [editHour, setEditHour] = useState(
    Math.floor(record.minutes / 60).toString()
  );
  const [editMinute, setEditMinute] = useState(
    (record.minutes % 60).toString()
  );

  useEffect(() => {
    setEditName(record.name);
    setEditHour(Math.floor(record.minutes / 60).toString());
    setEditMinute((record.minutes % 60).toString());
  }, [record]);

  const handleSave = () => {
    if (!editName.trim()) {
      alert('لطفاً نام را وارد کنید');
      return;
    }
    const totalMinutes =
      (parseInt(editHour, 10) || 0) * 60 + (parseInt(editMinute, 10) || 0);

    if (totalMinutes <= 0) {
      alert('زمان مطالعه نمی‌تواند صفر باشد.');
      return;
    }

    if (totalMinutes > 18 * 60) {
      alert('زمان مطالعه نمی‌تواند بیشتر از ۱۸ ساعت باشد.');
      return;
    }

    onUpdate(record.id, type, editName.trim(), totalMinutes);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setEditName(record.name);
    setEditHour(Math.floor(record.minutes / 60).toString());
    setEditMinute((record.minutes % 60).toString());
    setIsEditing(false);
    Keyboard.dismiss();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border"
      style={{ borderColor: isEditing ? themeColor : '#f1f5f9' }}
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
            <View className={`px-3 py-1.5 rounded-lg ${themeBg}`}>
              <Text
                className="font-main text-[10px] font-bold"
                style={{ color: themeColor }}
              >
                ویرایش اطلاعات
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
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 text-sm font-main"
                style={
                  {
                    outlineStyle: 'none',
                    textAlign: 'right',
                    borderColor: themeColor
                  } as any
                }
                value={editName}
                onChangeText={setEditName}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            className={`w-full py-3 rounded-xl border items-center justify-center active:scale-95 transition-all ${themeBg}`}
            style={{ borderColor: themeColor }}
          >
            <Text
              className="font-bold font-main text-sm"
              style={{ color: themeColor }}
            >
              ذخیره تغییرات
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => onApprove(record, type)}
              className="px-4 py-2 rounded-xl active:scale-95 transition-transform"
              style={{ backgroundColor: themeColor }}
            >
              <Text className="text-white font-bold font-main text-xs">
                تایید
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsEditing(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 items-center justify-center active:bg-slate-50"
            >
              <Ionicons name="pencil-outline" size={16} color="#64748b" />
            </Pressable>
            <Pressable
              onPress={() => onDelete(record.id, type)}
              className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50/50 items-center justify-center active:bg-rose-100"
            >
              <Ionicons name="trash-outline" size={16} color="#f43f5e" />
            </Pressable>
          </View>
          <View className="items-end justify-center">
            <View className="flex-row items-center gap-2 mb-1">
              {isConflict && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-amber-600 text-[10px] font-bold font-main">
                    تغییر نام
                  </Text>
                  <Ionicons name="warning" size={12} color="#d97706" />
                </View>
              )}
              {record.isFocussing && (
                <View className="flex-row items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  <Text className="text-rose-500 text-[10px] font-bold font-main">
                    Focusing
                  </Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </View>
              )}
              <Text className="text-slate-800 font-bold text-base font-main">
                {record.name}
              </Text>
            </View>
            <Text
              className="text-slate-500 text-xs font-main"
              style={{ direction: 'rtl' }}
            >
              زمان:{' '}
              <Text className="font-bold text-slate-700">
                {record.today_time}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export function ExtractedUsersList({
  oldUsers,
  newUsers,
  conflicts,
  onApprove,
  onApproveAll,
  onDelete,
  onUpdate
}: ExtractedUsersListProps) {
  return (
    <View className="mt-6 w-full pb-10">
      {oldUsers.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Pressable
              onPress={() => onApproveAll('OLD')}
              className="bg-indigo-100 px-4 py-1.5 rounded-lg active:scale-95"
            >
              <Text className="text-indigo-700 font-bold font-main text-xs">
                تایید همه
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-800 font-bold text-lg font-main">
                کاربران قدیمی
              </Text>
              <View className="w-2 h-2 rounded-full bg-indigo-500" />
            </View>
          </View>
          {oldUsers.map((user) => (
            <ExtractedUserCard
              key={user.id}
              record={user}
              type="OLD"
              themeColor="#6366f1"
              themeBg="bg-indigo-50"
              onApprove={onApprove}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </View>
      )}
      {newUsers.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Pressable
              onPress={() => onApproveAll('NEW')}
              className="bg-emerald-100 px-4 py-1.5 rounded-lg active:scale-95"
            >
              <Text className="text-emerald-700 font-bold font-main text-xs">
                تایید همه
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-800 font-bold text-lg font-main">
                کاربران جدید
              </Text>
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
            </View>
          </View>
          {newUsers.map((user) => (
            <ExtractedUserCard
              key={user.id}
              record={user}
              type="NEW"
              themeColor="#10b981"
              themeBg="bg-emerald-50"
              onApprove={onApprove}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </View>
      )}
      {conflicts.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-end items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-800 font-bold text-lg font-main">
                اسامی یکسان
              </Text>
              <View className="w-2 h-2 rounded-full bg-amber-500" />
            </View>
          </View>
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <Text className="text-amber-800 text-xs text-right font-main">
              چند نفر با اسم یکسان یافت شدند. لطفاً با زدن آیکون مداد نام آن‌ها
              را ویرایش کنید.
            </Text>
          </View>
          {conflicts.map((conflict) => (
            <View key={conflict.conflict_name} className="mb-2">
              {conflict.records.map((record) => (
                <ExtractedUserCard
                  key={record.id}
                  record={record}
                  type="CONFLICT"
                  isConflict={true}
                  themeColor="#f59e0b"
                  themeBg="bg-amber-50"
                  onApprove={onApprove}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
