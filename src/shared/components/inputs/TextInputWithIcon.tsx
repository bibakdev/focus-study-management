import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

interface TextInputWithIconProps extends TextInputProps {
  iconName: keyof typeof Ionicons.glyphMap;
}

export function TextInputWithIcon({
  iconName,
  ...props
}: TextInputWithIconProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center bg-surface-main border rounded-2xl px-4 py-3 gap-3 transition-all duration-200 ${
        isFocused
          ? 'border-primary-main bg-primary-light/30'
          : 'border-surface-muted'
      }`}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={isFocused ? '#4f46e5' : '#94a3b8'}
      />
      <TextInput
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor="#94a3b8"
        className="flex-1 text-text-primary text-sm font-main"
        style={{ textAlign: 'right', outlineStyle: 'none' } as any}
      />
    </View>
  );
}
