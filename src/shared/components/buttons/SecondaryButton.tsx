import React from 'react';
import { Text, Pressable, PressableProps } from 'react-native';

interface SecondaryButtonProps extends PressableProps {
  label: string;
}

export function SecondaryButton({ label, ...props }: SecondaryButtonProps) {
  return (
    <Pressable
      {...props}
      className="flex-row items-center justify-center bg-slate-100 rounded-2xl py-3 px-4 active:scale-95 active:bg-slate-200 transition-all duration-200 w-full"
    >
      <Text className="text-slate-600 font-bold text-lg text-center font-[Vazirmatn]">
        {label}
      </Text>
    </Pressable>
  );
}
