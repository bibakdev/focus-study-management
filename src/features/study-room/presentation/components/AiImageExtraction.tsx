// src/features/study-room/presentation/components/AiImageExtraction.tsx
import { PrimaryActionButton } from '@/shared/components/buttons/PrimaryActionButton';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

interface AiImageExtractionProps {
  onProcessImages: (base64Images: string[]) => void;
  isLoading: boolean;
}

interface SelectedImage {
  uri: string;
  base64: string;
}

export function AiImageExtraction({
  onProcessImages,
  isLoading
}: AiImageExtractionProps) {
  const [images, setImages] = useState<SelectedImage[]>([]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('برای انتخاب عکس، نیاز به دسترسی به گالری داریم!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // 🔴 امکان انتخاب چند عکس
      quality: 0.8,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets
        .filter((asset) => asset.base64)
        .map((asset) => ({
          uri: asset.uri,
          base64: asset.base64 as string
        }));

      // اضافه کردن عکس‌های جدید به لیست قبلی
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleProcess = () => {
    if (images.length > 0) {
      const base64Array = images.map((img) => img.base64);
      onProcessImages(base64Array);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Animated.View
      layout={Layout.springify().damping(15)}
      className="bg-surface-card rounded-3xl p-5 shadow-sm border border-surface-muted mt-4 overflow-hidden"
    >
      <View className="flex-row justify-end items-center gap-2 mb-4">
        <Text className="text-text-primary font-bold text-base font-main">
          استخراج هوشمند تصویر (AI)
        </Text>
        <Ionicons name="sparkles" size={20} color="#8b5cf6" />
      </View>

      {images.length === 0 ? (
        <Pressable
          onPress={pickImages}
          className="w-full h-32 border-2 border-dashed border-violet-200 bg-violet-50/50 rounded-2xl items-center justify-center active:bg-violet-50 transition-colors"
        >
          <Ionicons name="images-outline" size={32} color="#8b5cf6" />
          <Text className="text-violet-600 font-main font-bold mt-2 text-sm">
            انتخاب اسکرین‌شات‌ها از گالری
          </Text>
        </Pressable>
      ) : (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="items-center w-full"
        >
          {/* لیست افقی عکس‌ها */}
          <View className="w-full mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {images.map((img, index) => (
                <Animated.View
                  key={img.uri + index}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="relative w-24 h-32 rounded-xl overflow-hidden mr-3 border border-surface-muted"
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => removeImage(index)}
                    disabled={isLoading}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full items-center justify-center active:scale-95"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </Animated.View>
              ))}

              {/* دکمه افزودن عکس بیشتر */}
              <Pressable
                onPress={pickImages}
                disabled={isLoading}
                className="w-24 h-32 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 items-center justify-center active:bg-violet-100"
              >
                <Ionicons name="add" size={28} color="#8b5cf6" />
              </Pressable>
            </ScrollView>
          </View>

          <PrimaryActionButton
            label={`پردازش ${images.length} تصویر با Gemini`}
            iconName="scan"
            onPress={handleProcess}
            isLoading={isLoading}
            style={{ backgroundColor: '#8b5cf6' }}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
