import { Text, TouchableOpacity, View } from 'react-native';

export default function IndexScreen() {
  return (
    // جایگزین استایل کانتینر پیش‌فرض
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      {/* عنوان اصلی اپلیکیشن */}
      <Text className="text-3xl font-bold text-slate-800 mb-3 text-center">
        Focus To-Do Sync
      </Text>

      {/* توضیحات زیر عنوان */}
      <Text className="text-base text-slate-500 text-center mb-10 leading-6">
        به سیستم مدیریت زمان، چالش‌های گروهی و رتبه‌بندی خوش آمدید!
      </Text>

      {/* یک دکمه نمونه با استایل‌های تیل‌ویند */}
      <TouchableOpacity className="bg-indigo-600 w-full max-w-sm py-4 rounded-2xl active:bg-indigo-800">
        <Text className="text-white text-center font-bold text-lg">
          ورود به اتاق مطالعه
        </Text>
      </TouchableOpacity>
    </View>
  );
}
