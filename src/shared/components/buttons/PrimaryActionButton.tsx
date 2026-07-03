import { Ionicons } from '@expo/vector-icons';
import { Pressable, PressableProps, Text } from 'react-native';

interface PrimaryActionButtonProps extends PressableProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
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
      className={`flex-row items-center justify-center bg-primary-main rounded-2xl py-3 px-4 active:scale-95 transition-all duration-200 gap-2 w-full ${isLoading || props.disabled ? 'opacity-70' : 'opacity-100'}`}
    >
      {iconName && !isLoading && (
        <Ionicons name={iconName} size={20} color="white" />
      )}
      <Text className="text-text-inverse font-bold text-lg text-center font-main">
        {isLoading ? 'در حال پردازش...' : label}
      </Text>
    </Pressable>
  );
}
