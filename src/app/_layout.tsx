// src/app/_layout.tsx
import { expoDb } from '@/core/database/db';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native'; // <--- این را اضافه کنید
import {
  configureReanimatedLogger,
  ReanimatedLogLevel
} from 'react-native-reanimated';
import '../../global.css';

// غیرفعال کردن هشدارهای Reanimated
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false
});

// 🔴 غیرفعال کردن خطای زودهنگام اکسپو روتر
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet"
]);

export default function RootLayout() {
  useDrizzleStudio(expoDb);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
