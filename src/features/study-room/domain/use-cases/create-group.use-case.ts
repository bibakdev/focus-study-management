// src/features/study-room/domain/use-cases/create-group.use-case.ts
import { GroupRepository } from '../repositories/group.repository';
import {
  createGroupSchema,
  CreateGroupInput
} from '../validators/room.validator';
import { Group } from '../entities/group';

export class CreateGroupUseCase {
  constructor(private readonly repository: GroupRepository) {}

  async execute(input: CreateGroupInput): Promise<Group> {
    // مرحله ۱: اعتبارسنجی دقیق ورودی‌ها با Zod
    const validatedData = createGroupSchema.parse(input);

    // مرحله ۲: پاس دادن اطلاعات به لایه دیتا
    return await this.repository.createGroup(validatedData);
  }
}
