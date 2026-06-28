import { Stack } from 'expo-router';
import '../../global.css'; // آدرس درست فایل اصلی تیل‌ویند
export default function RootLayout() {
  return (
    // استفاده از Stack برای مدیریت صفحات بدون تب‌های اضافی
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
