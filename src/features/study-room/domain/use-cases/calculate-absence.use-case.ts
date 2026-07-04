import { MemberStatusRepository } from '../repositories/member-status.repository';

export class CalculateAbsenceUseCase {
  constructor(private readonly repository: MemberStatusRepository) {}

  async execute(groupId: string): Promise<void> {
    const { members, dates, logs } =
      await this.repository.getGroupDataForCalculation(groupId);

    if (dates.length === 0) return;

    const updatedMembers = members.map((member) => {
      let absenceDays = 0;
      let activeStreak = 0; // متغیر استمرار برگشت
      let isActive = true;

      // حلقه روی تاریخ‌ها (از قدیمی به جدید)
      for (const date of dates) {
        const hasLog = logs.find(
          (l) =>
            l.memberId === member.id &&
            l.groupDateId === date.id &&
            l.studyMinutes > 0
        );

        if (hasLog) {
          // اگر تایم زد، غیبت صفر شده و استمرار بالا می‌رود
          absenceDays = 0;
          activeStreak += 1;
          isActive = true;
        } else {
          // اگر تایم نزد، استمرار صفر شده و غیبت بالا می‌رود
          absenceDays += 1;
          activeStreak = 0;
          isActive = false;
        }
      }

      return {
        id: member.id,
        isActive,
        absenceDays,
        activeStreak // حالا عدد واقعی استمرار در دیتابیس ذخیره می‌شود
      };
    });

    await this.repository.updateMembersStatus(updatedMembers);
  }
}
