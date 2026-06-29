import React, { useState } from 'react';
import { View, TextInput, TextInputProps, Platform } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';

interface TextInputWithIconProps extends TextInputProps {
  iconName: SFSymbol;
}

export function TextInputWithIcon({
  iconName,
  ...props
}: TextInputWithIconProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center bg-slate-50 border rounded-2xl px-4 py-3 gap-3 transition-all duration-200 ${
        isFocused ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'
      }`}
    >
      <SymbolView
        name={iconName}
        size={20}
        tintColor={isFocused ? '#4f46e5' : '#94a3b8'} // indigo-600 vs slate-400
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
        placeholderTextColor="#94a3b8" // slate-400
        className="flex-1 text-slate-800 text-sm font-[Vazirmatn]"
        style={{ textAlign: 'right', outlineStyle: 'none' } as any} // حذف اوت‌لاین دیفالت در وب/برخی پلتفرم‌ها
      />
    </View>
  );
}
