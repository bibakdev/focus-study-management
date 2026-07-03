import { Pressable, Text, View } from 'react-native';

export type FilterStatus = 'all' | 'active' | 'inactive';

interface FilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  const tabs: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'همه' },
    { id: 'active', label: 'فعال' },
    { id: 'inactive', label: 'غیرفعال' }
  ];

  return (
    <View className="flex-row bg-surface-muted p-1 rounded-2xl mt-4">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onFilterChange(tab.id)}
            className="flex-1"
          >
            {/* 
              View داینامیک داخل قرار گرفت تا هم ظاهر دکمه‌ها حفظ بشه 
              و هم NativeWind باعث کرش کردن Pressable نشه 
            */}
            <View
              className={`w-full py-2 items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-surface-card shadow-sm' : 'bg-transparent'
              }`}
            >
              <Text
                className={`font-main text-sm font-bold ${
                  isActive ? 'text-primary-main' : 'text-text-muted'
                }`}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
