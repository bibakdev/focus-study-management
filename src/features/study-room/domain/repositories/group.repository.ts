// src/features/study-room/domain/repositories/group.repository.ts
import { Group } from '../entities/group';
import { CreateGroupInput } from '../validators/room.validator';

export interface GroupRepository {
  /**
   * ایجاد یک گروه جدید در دیتابیس
   * @param data اطلاعات ولید شده گروه
   * @returns گروه ایجاد شده
   */
  createGroup(data: CreateGroupInput): Promise<Group>;

  /**
   * حذف یک گروه بر اساس شناسه
   * @param id شناسه گروه
   */
  deleteGroup(id: string): Promise<void>;
}
