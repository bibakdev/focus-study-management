import { db } from '@/core/database/db';
import { groupDates } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { and, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { TimeTabPresentational } from './TimeTab.presentational';

interface TimeTabContainerProps {
  groupId: string;
}

export function TimeTabContainer({ groupId }: TimeTabContainerProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // استیت جدید برای جلوگیری از تداخل useEffect هنگام ویرایش دستی
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { data: savedDates } = useLiveQuery(
    db
      .select()
      .from(groupDates)
      .where(eq(groupDates.groupId, groupId))
      .orderBy(desc(groupDates.createdAt))
  );

  useEffect(() => {
    // شرط !isEditing باعث می‌شود که اگر کاربر دکمه "تغییر" را زد، این افکت مقدار دیتابیس را جایگزین نکند
    if (savedDates && savedDates.length > 0 && !activeDate && !isEditing) {
      setActiveDate(savedDates[0].persianDate);
    }
  }, [savedDates, activeDate, isEditing]);

  const handleConfirmDate = async (date: string) => {
    try {
      const existingRecords = await db
        .select()
        .from(groupDates)
        .where(
          and(eq(groupDates.groupId, groupId), eq(groupDates.persianDate, date))
        );

      if (existingRecords.length === 0) {
        await db.insert(groupDates).values({
          id: generateUUID(),
          groupId: groupId,
          persianDate: date,
          createdAt: new Date()
        });
      }

      // خروج از حالت ویرایش و ثبت تاریخ جدید
      setIsEditing(false);
      setActiveDate(date);
    } catch (error) {
      console.error('Database Error (Save Date):', error);
      Alert.alert('خطا', 'مشکلی در ذخیره تاریخ در پایگاه داده به وجود آمد.');
    }
  };

  const handleEditDate = () => {
    // وارد شدن به حالت ویرایش و باز کردن فرم با نال کردن تاریخ
    setIsEditing(true);
    setActiveDate(null);
  };

  return (
    <TimeTabPresentational
      selectedDate={activeDate}
      onConfirmDate={handleConfirmDate}
      onEditDate={handleEditDate}
    />
  );
}
