import { GlassIconButton } from '@/shared/components/buttons/GlassIconButton';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Group } from '../../domain/entities/group';

interface RoomHeaderProps {
  currentGroup: Group | null;
  allGroups: Group[];
  onGroupSelect: (groupId: string) => void;
  onManageGroupsPress: () => void;
}

export function RoomHeader({
  currentGroup,
  allGroups,
  onGroupSelect,
  onManageGroupsPress
}: RoomHeaderProps) {
  const insets = useSafeAreaInsets();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<View>(null);

  const toggleDropdown = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    } else {
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPos({
          top: pageY + height + 8,
          left: pageX
        });
        setIsDropdownOpen(true);
      });
    }
  };

  const handleSelect = (id: string) => {
    onGroupSelect(id);
    setIsDropdownOpen(false);
  };

  return (
    <View className="z-40">
      <View
        className="bg-primary-main rounded-b-3xl shadow-md px-5 pb-6"
        style={{ paddingTop: Math.max(insets.top, 20) + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {/* تغییر آیکون به grid از Ionicons */}
            <GlassIconButton iconName="grid" onPress={onManageGroupsPress} />

            <View ref={buttonRef} collapsable={false}>
              <Pressable
                onPress={toggleDropdown}
                className="flex-row items-center justify-start bg-surface-glass px-3 py-2.5 rounded-2xl active:scale-95 transition-all w-36"
              >
                <Ionicons
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="white"
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="text-text-inverse font-bold text-sm ml-2 font-main flex-1 text-left"
                >
                  {currentGroup ? currentGroup.name : 'انتخاب گروه'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 bg-surface-glass rounded-xl items-center justify-center">
              {/* تغییر آیکون به book از Ionicons */}
              <Ionicons name="book" size={16} color="white" />
            </View>
          </View>
        </View>
      </View>

      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View className="flex-1 bg-text-primary/20">
            <View
              className="absolute w-56 bg-surface-card rounded-2xl shadow-xl border border-surface-muted overflow-hidden"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <ScrollView
                className="max-h-64"
                showsVerticalScrollIndicator={false}
              >
                {allGroups.length === 0 ? (
                  <Text className="text-text-muted p-4 text-center font-main text-sm">
                    هیچ گروهی یافت نشد
                  </Text>
                ) : (
                  allGroups.map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => handleSelect(group.id)}
                      className={`px-4 py-4 border-b border-surface-muted active:bg-surface-muted transition-colors ${
                        currentGroup?.id === group.id
                          ? 'bg-primary-light/40'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        {currentGroup?.id === group.id && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#4f46e5"
                          />
                        )}
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          className={`font-main text-right flex-1 ${
                            currentGroup?.id === group.id
                              ? 'text-primary-main font-bold'
                              : 'text-text-secondary'
                          }`}
                        >
                          {group.name}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
