import { db } from '@/core/database/db';
import { groups } from '@/core/database/schema';
import { generateUUID } from '@/core/utils/uuid';
import { desc } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function BootstrapperScreen() {
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      try {
        // ۱. بررسی گروه‌های موجود در دیتابیس
        const existingGroups = await db
          .select()
          .from(groups)
          .orderBy(desc(groups.createdAt));

        if (existingGroups.length > 0) {
          // ۲. اگر گروهی هست، مستقیماً وارد جدیدترین گروه شوید
          router.replace(`/room/${existingGroups[0].id}`);
        } else {
          // ۳. اگر اولین بار است و گروهی نیست، گروه پیش‌فرض را بسازید
          const newGroupId = generateUUID();
          await db.insert(groups).values({
            id: newGroupId,
            name: 'گروه اصلی',
            bananaThreshold: 120,
            eggplantThreshold: 30,
            maxEggplantsAllowed: 3,
            createdAt: new Date()
          });

          // و سپس وارد آن شوید
          router.replace(`/room/${newGroupId}`);
        }
      } catch (error) {
        console.error('Bootstrapper Error:', error);
        // در صورت بروز خطای غیرمنتظره، صفحه مدیریت گروه‌ها باز شود
        router.replace('/groups');
      }
    };

    initApp();
  }, [router]);

  return (
    // یک صفحه لودینگ ساده برای چند هزارم ثانیه‌ای که دیتابیس چک می‌شود
    <View className="flex-1 bg-slate-50 items-center justify-center">
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}
