// src/app/debug.tsx
import { db } from '@/core/database/db';
import {
  groupDates,
  groups,
  members,
  memberTargets
} from '@/core/database/schema'; // اضافه شدن groupDates
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';

// تب جدید dates اضافه شد
type TabType = 'groups' | 'members' | 'targets' | 'dates';

export default function DebugScreen() {
  const router = useRouter();

  // استیت تب فعال
  const [activeTab, setActiveTab] = useState<TabType>('groups');

  // خواندن مجزای دیتاهای هر جدول
  const { data: allGroups } = useLiveQuery(db.select().from(groups));
  const { data: allMembers } = useLiveQuery(db.select().from(members));
  const { data: allTargets } = useLiveQuery(db.select().from(memberTargets));
  const { data: allDates } = useLiveQuery(db.select().from(groupDates)); // کوئری جدول جدید

  // استیت‌های مربوط به مدال ویرایش (فعلاً برای گروه‌ها)
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    bananaThreshold: '',
    eggplantThreshold: '',
    maxEggplantsAllowed: ''
  });

  // هندلر حذف داینامیک بر اساس تب فعال
  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'groups') {
        await db.delete(groups).where(eq(groups.id, id));
      } else if (activeTab === 'members') {
        await db.delete(members).where(eq(members.id, id));
      } else if (activeTab === 'targets') {
        await db.delete(memberTargets).where(eq(memberTargets.id, id));
      } else if (activeTab === 'dates') {
        await db.delete(groupDates).where(eq(groupDates.id, id)); // منطق حذف تاریخ
      }
      Alert.alert('موفق', 'رکورد حذف شد');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در حذف پیش آمد');
    }
  };

  // باز کردن فرم ویرایش (مختص گروه)
  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      bananaThreshold: String(group.bananaThreshold),
      eggplantThreshold: String(group.eggplantThreshold),
      maxEggplantsAllowed: String(group.maxEggplantsAllowed)
    });
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      await db
        .update(groups)
        .set({
          name: editForm.name,
          bananaThreshold: parseInt(editForm.bananaThreshold) || 120,
          eggplantThreshold: parseInt(editForm.eggplantThreshold) || 30,
          maxEggplantsAllowed: parseInt(editForm.maxEggplantsAllowed) || 3
        })
        .where(eq(groups.id, editingGroup.id));

      setEditingGroup(null);
      Alert.alert('موفق', 'تغییرات گروه ذخیره شد');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ویرایش پیش آمد');
    }
  };

  // تابع کمکی برای دریافت دیتای تب فعال
  const getActiveData = () => {
    if (activeTab === 'groups') return allGroups;
    if (activeTab === 'members') return allMembers;
    if (activeTab === 'targets') return allTargets;
    if (activeTab === 'dates') return allDates; // بازگرداندن دیتای تاریخ‌ها
    return [];
  };

  const activeData = getActiveData();

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-4">
      {/* هدر */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white font-bold text-xl font-[Vazirmatn]">
          🛠 پنل دیتابیس
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-slate-700 px-4 py-2 rounded-lg active:scale-95"
        >
          <Text className="text-white font-bold font-[Vazirmatn]">برگشت</Text>
        </Pressable>
      </View>

      {/* تب‌ها */}
      <View className="flex-row gap-2 mb-4 bg-slate-800 p-1 rounded-xl">
        <Pressable
          onPress={() => setActiveTab('groups')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'groups' ? 'bg-indigo-600' : 'bg-transparent'}`}
        >
          <Text className="text-white text-xs font-bold font-[Vazirmatn]">
            گروه‌ها
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('members')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'members' ? 'bg-indigo-600' : 'bg-transparent'}`}
        >
          <Text className="text-white text-xs font-bold font-[Vazirmatn]">
            اعضا
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('targets')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'targets' ? 'bg-indigo-600' : 'bg-transparent'}`}
        >
          <Text className="text-white text-xs font-bold font-[Vazirmatn]">
            تارگت‌ها
          </Text>
        </Pressable>
        {/* تب جدید تاریخ‌ها */}
        <Pressable
          onPress={() => setActiveTab('dates')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'dates' ? 'bg-indigo-600' : 'bg-transparent'}`}
        >
          <Text className="text-white text-xs font-bold font-[Vazirmatn]">
            تاریخ‌ها
          </Text>
        </Pressable>
      </View>

      {/* لیست دیتاها */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeData?.length === 0 && (
          <Text className="text-slate-400 text-center mt-10 font-[Vazirmatn]">
            جدول {activeTab} در حال حاضر خالی است.
          </Text>
        )}

        {activeData?.map((record: any) => (
          <View
            key={record.id}
            className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700"
          >
            <Text
              className="text-emerald-400 font-mono text-xs text-left mb-4"
              style={{ writingDirection: 'ltr' }}
            >
              {JSON.stringify(record, null, 2)}
            </Text>

            <View className="flex-row gap-2">
              {/* دکمه ویرایش فقط برای تب گروه‌ها نمایش داده می‌شود */}
              {activeTab === 'groups' && (
                <Pressable
                  onPress={() => openEditModal(record)}
                  className="flex-1 bg-indigo-600 py-3 rounded-lg active:bg-indigo-700 active:scale-95"
                >
                  <Text className="text-white text-center font-bold font-[Vazirmatn]">
                    ویرایش
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => handleDelete(record.id)}
                className="flex-1 bg-rose-600 py-3 rounded-lg active:bg-rose-700 active:scale-95"
              >
                <Text className="text-white text-center font-bold font-[Vazirmatn]">
                  حذف
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* مدال ویرایش گروه */}
      <Modal visible={!!editingGroup} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/70 px-4">
          <View className="bg-slate-800 p-5 rounded-2xl w-full border border-slate-700">
            <Text className="text-white font-bold text-lg mb-4 text-center font-[Vazirmatn]">
              ویرایش مستقیم رکورد
            </Text>

            <TextInput
              className="bg-slate-900 text-white p-3 rounded-lg mb-3 font-[Vazirmatn] text-right"
              placeholder="نام گروه"
              placeholderTextColor="#64748b"
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            />
            <TextInput
              className="bg-slate-900 text-white p-3 rounded-lg mb-3 font-[Vazirmatn] text-right"
              placeholder="تارگت موز"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={editForm.bananaThreshold}
              onChangeText={(text) =>
                setEditForm({ ...editForm, bananaThreshold: text })
              }
            />
            <TextInput
              className="bg-slate-900 text-white p-3 rounded-lg mb-3 font-[Vazirmatn] text-right"
              placeholder="حداقل بادمجون"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={editForm.eggplantThreshold}
              onChangeText={(text) =>
                setEditForm({ ...editForm, eggplantThreshold: text })
              }
            />
            <TextInput
              className="bg-slate-900 text-white p-3 rounded-lg mb-5 font-[Vazirmatn] text-right"
              placeholder="سقف مجاز"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={editForm.maxEggplantsAllowed}
              onChangeText={(text) =>
                setEditForm({ ...editForm, maxEggplantsAllowed: text })
              }
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditingGroup(null)}
                className="flex-1 bg-slate-600 py-3 rounded-lg active:scale-95"
              >
                <Text className="text-white text-center font-bold font-[Vazirmatn]">
                  انصراف
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateGroup}
                className="flex-1 bg-emerald-600 py-3 rounded-lg active:scale-95"
              >
                <Text className="text-white text-center font-bold font-[Vazirmatn]">
                  ذخیره
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
