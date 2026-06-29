// src/features/study-room/data/repositories/group.repository.impl.ts
import { eq } from 'drizzle-orm';
import { db } from '@/core/database/db';
import { groups } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { CreateGroupInput } from '../../domain/validators/room.validator';
import { Group } from '../../domain/entities/group';

export class GroupRepositoryImpl implements GroupRepository {
  async createGroup(data: CreateGroupInput): Promise<Group> {
    const newGroup = {
      id: generateUUID(),
      name: data.name,
      bananaThreshold: data.bananaThreshold,
      eggplantThreshold: data.eggplantThreshold,
      maxEggplantsAllowed: data.maxEggplantsAllowed,
      createdAt: new Date()
    };

    // ذخیره رکورد در دیتابیس
    await db.insert(groups).values(newGroup);

    return newGroup;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }
}

// ساخت یک نمونه سینگلتون (Singleton) برای استفاده در Use-case ها
export const groupRepository = new GroupRepositoryImpl();
