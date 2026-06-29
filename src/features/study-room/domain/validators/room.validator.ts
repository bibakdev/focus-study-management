import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2, 'نام گروه باید حداقل ۲ کاراکتر باشد').max(50),
  bananaThreshold: z.number().min(0, 'تارگت نمی‌تواند منفی باشد'),
  eggplantThreshold: z.number().min(0, 'حد نصاب نمی‌تواند منفی باشد'),
  maxEggplantsAllowed: z.number().min(1, 'حداقل ۱ بادمجون مجاز است')
});

export const createMemberSchema = z.object({
  groupId: z.string().uuid('شناسه گروه نامعتبر است'),
  name: z.string().min(2, 'نام عضو باید حداقل ۲ کاراکتر باشد').max(40)
});

export const updateTargetSchema = z
  .object({
    targetType: z.enum(['FIXED', 'WEEKLY']),
    defaultMinutes: z.number().min(0),
    saturdayMinutes: z.number().min(0),
    sundayMinutes: z.number().min(0),
    mondayMinutes: z.number().min(0),
    tuesdayMinutes: z.number().min(0),
    wednesdayMinutes: z.number().min(0),
    thursdayMinutes: z.number().min(0),
    fridayMinutes: z.number().min(0)
  })
  .refine(
    (data) => {
      if (data.targetType === 'FIXED' && data.defaultMinutes === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'تارگت ثابت نمی‌تواند صفر باشد',
      path: ['defaultMinutes']
    }
  );

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
