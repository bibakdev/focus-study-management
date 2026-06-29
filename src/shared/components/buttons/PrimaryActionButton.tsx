import React from 'react';
import { Text, Pressable, PressableProps, View } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';

interface PrimaryActionButtonProps extends PressableProps {
  label: string;
  iconName?: SFSymbol;
  isLoading?: boolean;
}

export function PrimaryActionButton({
  label,
  iconName,
  isLoading,
  ...props
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={isLoading || props.disabled}
      className={`flex-row items-center justify-center bg-indigo-600 rounded-2xl py-3 px-4 active:scale-95 active:bg-indigo-700 transition-all duration-200 gap-2 w-full ${isLoading || props.disabled ? 'opacity-70' : 'opacity-100'}`}
    >
      {iconName && !isLoading && (
        <SymbolView name={iconName} size={20} tintColor="white" weight="bold" />
      )}
      <Text className="text-white font-bold text-lg text-center font-[Vazirmatn]">
        {isLoading ? 'در حال پردازش...' : label}
      </Text>
    </Pressable>
  );
}
