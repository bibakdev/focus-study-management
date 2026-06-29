import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';

interface GlassIconButtonProps extends PressableProps {
  iconName: SFSymbol;
}

export function GlassIconButton({ iconName, ...props }: GlassIconButtonProps) {
  return (
    <Pressable
      {...props}
      className="p-2 rounded-lg bg-white/20 active:scale-95 transition-all duration-200 overflow-hidden backdrop-blur-sm"
    >
      <SymbolView name={iconName} size={24} tintColor="white" weight="medium" />
    </Pressable>
  );
}
