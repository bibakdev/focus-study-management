// src/features/study-room/presentation/hooks/use-groups.ts
import { db } from '@/core/database/db';
import { groups } from '@/core/database/schema';
import { desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';
import { groupRepository } from '../../data/repositories/group.repository.impl';
import { Group } from '../../domain/entities/group';
import { CreateGroupUseCase } from '../../domain/use-cases/create-group.use-case';
import { CreateGroupInput } from '../../domain/validators/room.validator';

const createGroupUseCase = new CreateGroupUseCase(groupRepository);

export function useGroups() {
  // استیت‌های محلی برای نگهداری گروه‌ها
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // تابع خواندن اطلاعات از دیتابیس
  const fetchGroups = useCallback(async () => {
    try {
      const data = await db
        .select()
        .from(groups)
        .orderBy(desc(groups.createdAt));
      // تبدیل تایپ خروجی دیتابیس به تایپ Group
      setGroupsList(data as unknown as Group[]);
    } catch (error) {
      console.error('خطا در دریافت لیست گروه‌ها:', error);
    }
  }, []);

  // اجرای اولیه هنگام لود شدن صفحه
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // هندلر ساخت گروه جدید
  const createGroup = async (input: CreateGroupInput) => {
    setIsCreating(true);
    try {
      await createGroupUseCase.execute(input);
      // بعد از ثبت موفق، لیست را بلافاصله آپدیت می‌کنیم
      await fetchGroups();
    } catch (err) {
      console.error('خطا در ساخت گروه (لایه هوک):', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    groupsList,
    createGroup,
    isCreating
  };
}
