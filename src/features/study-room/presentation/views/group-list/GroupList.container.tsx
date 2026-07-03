// src/features/study-room/presentation/views/group-list/GroupList.container.tsx
import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { SecondaryButton } from '@/shared/components/buttons/SecondaryButton';
import { TextInputWithIcon } from '@/shared/components/inputs/TextInputWithIcon';
import { BottomSheetModal } from '@/shared/components/modals/BottomSheetModal';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, LogBox, View } from 'react-native';
import { Group } from '../../../domain/entities/group';
import { useGroups } from '../../hooks/use-groups';
import { GroupListPresentational } from './GroupList.presentational';

// غیرفعال کردن موقت Warning مزاحم (برای اطمینان مضاعف در محیط توسعه)
LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render'
]);

export function GroupListContainer() {
  const router = useRouter();

  // دریافت وضعیت زنده دیتابیس و توابع عملیاتی
  const { groupsList, createGroup, isCreating } = useGroups();

  // استیت‌های مربوط به UI و فرم
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');

  // هندلر باز کردن مدال
  const handleOpenModal = () => setIsModalVisible(true);

  // هندلر بستن مدال و ریست فرم
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setGroupName('');
  };

  // هندلر سابمیت فرم
  const handleSubmit = async () => {
    if (!groupName.trim()) {
      Alert.alert('دقت کنید', 'لطفاً نام گروه را وارد کنید.');
      return;
    }

    try {
      // ارسال مقادیر پیش‌فرض همراه با نام گروه به لایه دامین
      await createGroup({
        name: groupName.trim(),
        bananaThreshold: 120,
        eggplantThreshold: 30,
        maxEggplantsAllowed: 3
      });

      handleCloseModal(); // بستن مدال
      Alert.alert('موفق', 'گروه جدید با موفقیت ساخته شد!');
    } catch (error: any) {
      console.error('❌ جزئیات خطای ثبت گروه:', error);

      // مدیریت خطاهای ولیدیشن Zod
      if (error?.issues && error.issues.length > 0) {
        Alert.alert('خطای ورودی', error.issues[0].message);
      } else {
        // خطاهای ناشناخته سیستم
        Alert.alert(
          'خطای سیستم',
          'مشکلی در دیتابیس پیش آمد. کنسول را چک کنید.'
        );
      }
    }
  };
  // هندلر ورود به جزئیات گروه
  const handleGroupPress = (group: Group) => {
    router.push(`/room/${group.id}`);
  };

  // هندلر دکمه تنظیمات (هدایت به پنل دیباگ و دیتابیس)
  const handleSettingsPress = () => {
    router.push('/debug');
  };

  return (
    <View className="flex-1 bg-slate-900">
      <GroupListPresentational
        groups={groupsList || []}
        onAddGroupPress={handleOpenModal}
        onGroupPress={handleGroupPress}
        onSettingsPress={handleSettingsPress}
      />

      <BottomSheetModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        title="ساخت گروه جدید"
        description="نام اتاق مطالعه خود را وارد کنید."
      >
        <View className="gap-4">
          <TextInputWithIcon
            iconName="people"
            placeholder="نام گروه (حداقل ۲ کاراکتر)"
            value={groupName}
            onChangeText={setGroupName}
          />

          {/* دکمه‌های اکشن */}
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <SecondaryButton label="انصراف" onPress={handleCloseModal} />
            </View>
            <View className="flex-1">
              <PrimaryActionButton
                label="ثبت گروه"
                onPress={handleSubmit}
                isLoading={isCreating}
              />
            </View>
          </View>
        </View>
      </BottomSheetModal>
    </View>
  );
}
