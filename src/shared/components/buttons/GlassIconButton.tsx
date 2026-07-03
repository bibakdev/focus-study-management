import { Ionicons } from '@expo/vector-icons';
import { Pressable, PressableProps } from 'react-native';

interface GlassIconButtonProps extends PressableProps {
  iconName: keyof typeof Ionicons.glyphMap;
}

export function GlassIconButton({ iconName, ...props }: GlassIconButtonProps) {
  return (
    <Pressable
      {...props}
      className="p-2 rounded-lg bg-surface-glass active:scale-95 transition-all duration-200 overflow-hidden"
    >
      <Ionicons name={iconName} size={24} color="white" />
    </Pressable>
  );
}
